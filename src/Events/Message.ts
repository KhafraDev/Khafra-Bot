import { KhafraClient } from '#khaf/Bot';
import { Arguments, Command } from '#khaf/Command';
import { pool } from '#khaf/database/Postgres.js';
import { client } from '#khaf/database/Redis.js';
import { Event } from '#khaf/Event';
import { Logger } from '#khaf/Logger';
import { kGuild, PartialGuild } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { DM } from '#khaf/utility/EventEvents/Message_DM.js';
import { Imgur } from '#khaf/utility/EventEvents/Message_ImgurAlbum.js';
import { Sanitize } from '#khaf/utility/EventEvents/Message_SanitizeCommand.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Stats } from '#khaf/utility/Stats.js';
import { plural, upperCase } from '#khaf/utility/String.js';
import { bold, inlineCode } from '@khaf/builders';
import { DiscordAPIError, Message, MessageAttachment, MessageEmbed, ReplyMessageOptions } from 'discord.js';
import { join } from 'path';
import { argv } from 'process';
import { MessagesLRU } from '../lib/Cache/Messages.js';
import { cooldown } from '../Structures/Cooldown/GlobalCooldown.js';

export const logger = new Logger();

export const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'));

export const defaultSettings: PartialGuild = {
    prefix: config.prefix,
    max_warning_points: 20,
    mod_log_channel: null,
    welcome_channel: null,
};

export const _cooldownGuild = cooldown(30, 60000);
export const _cooldownUsers = cooldown(10, 60000);

export const processArgs = new Minimalist(argv.slice(2).join(' '));
export const disabled = typeof processArgs.get('disabled') === 'string'
    ? (processArgs.get('disabled') as string)
        .split(',')
        .map(c => c.toLowerCase())
    : [];

export class kEvent extends Event<'messageCreate'> {
    name = 'messageCreate' as const;

    async init(message: Message) {
        Stats.messages++;

        if (message.channel.type === 'DM') return DM(message);
        if (!Sanitize(message)) return;

        const [name, ...args] = message.content.split(/\s+/g);
    
        let guild!: typeof defaultSettings | kGuild;
        const row = await client.get(message.guild.id);

        if (row) {
            guild = { ...defaultSettings, ...JSON.parse(row) as kGuild };
        } else {
            const { rows } = await pool.query<kGuild>(`
                SELECT * 
                FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [message.guild.id]);

            if (rows.length !== 0) {
                void client.set(message.guild.id, JSON.stringify(rows[0]), 'EX', 600);

                guild = { ...defaultSettings, ...rows.shift() };
            } else {
                guild = { ...defaultSettings };
            }
        }

        const prefix = guild?.prefix ?? config.prefix;
        const commandName = name.slice(prefix.length).toLowerCase();
        // !say hello world -> hello world
        const content = message.content.slice(prefix.length + commandName.length + 1);
        const cli = new Minimalist(content);

        MessagesLRU.set(message.id, message);

        if (!name.startsWith(prefix)) {
            const imgur = await Imgur.album([name, ...args]);
            if (imgur === undefined || !Array.isArray(imgur.u) || imgur.u.length < 2) return;

            let desc = `${imgur.u.length.toLocaleString()} Total Images\n`;
            for (const image of imgur.u) {
                const line = `${image}, `;
                if (desc.length + line.length > 2048) break;

                desc += line;
            }

            return void dontThrow(message.reply({
                content: 
                    `You posted an Imgur album, which don't embed correctly! ` + 
                    `Here are all the images in the album:`,
                embeds: [
                    Embed.ok(desc.trim()).setTitle(imgur.t)
                ]
            }));
        }

        if (!KhafraClient.Commands.has(commandName)) return;

        const command = KhafraClient.Commands.get(commandName)!;
        // command cooldowns are based around the commands name, not aliases
        const limited = command.rateLimit.isRateLimited(message.author.id);

        if (limited) {
            if (command.rateLimit.isNotified(message.author.id)) return;

            const cooldownInfo = command.rateLimit.get(message.author.id)!;
            const rateLimitSeconds = command.rateLimit.rateLimitSeconds;
            const delay = rateLimitSeconds - ((Date.now() - cooldownInfo.added) / 1_000);

            return dontThrow(message.reply({
                content: 
                    `${upperCase(command.settings.name)} has a ${rateLimitSeconds} second rate limit! ` +
                    `Please wait ${delay.toFixed(2)} second${plural(Number(delay.toFixed(2)))} to use this command again! ❤️`
            }));
        } else if (disabled.includes(command.settings.name) || command.settings.aliases?.some(c => disabled.includes(c))) {
            return void dontThrow(message.reply({
                content: `${inlineCode(commandName)} is temporarily disabled!`
            }));
        } else if (!limited) {
            command.rateLimit.rateLimitUser(message.author.id);
        }
        
        if (command.settings.ownerOnly && !Command.isBotOwner(message.author.id)) {
            return dontThrow(message.reply({ 
                embeds: [
                    Embed.error(`\`${command.settings.name}\` is only available to the bot owner!`)
                ] 
            }));
        }

        const [min, max = Infinity] = command.settings.args;
        if (min > args.length || args.length > max) {
            return dontThrow(message.reply({ embeds: [Embed.error(`
            Incorrect number of arguments provided.
            
            The command requires ${min} minimum arguments and ${max ?? 'no'} max.
            Example(s):
            ${command.help.slice(1).map(c => inlineCode(`${guild.prefix}${command.settings.name} ${c || '​'}`.trim())).join('\n')}
            `)] }));
        }

        if (!_cooldownUsers(message.author.id)) {
            return dontThrow(message.reply({ embeds: [Embed.error(`Users are limited to 10 commands a minute.`)] }));
        } else if (!_cooldownGuild(message.guild.id)) {
            return dontThrow(message.reply({ embeds: [Embed.error(`Guilds are limited to 30 commands a minute.`)] }));
        } else if (!hasPerms(message.channel, message.member, command.permissions)) {
            return dontThrow(message.reply({
                embeds: [
                    Embed.perms(message.channel, message.member, command.permissions)
                ]
            }));
        }

        let err: Error | void;
        Stats.session++;

        try {
            const options: Arguments = { args, commandName, content, prefix, cli };
            const returnValue = await command.init(message, options, guild);
            if (!returnValue || returnValue instanceof Message) 
                return;

            const param = {
                failIfNotExists: false
            } as ReplyMessageOptions;
            
            if (typeof returnValue === 'string')
                param.content = returnValue;
            else if (returnValue instanceof MessageEmbed)
                param.embeds = [returnValue];
            else if (returnValue instanceof MessageAttachment)
                param.files = [returnValue];
            else if (typeof returnValue === 'object') // MessageOptions
                Object.assign(param, returnValue);
            
            if ([...command.settings.aliases!, command.settings.name].some(n => KhafraClient.Interactions.has(n))) {
                const toAdd = `${bold('Tip: use the slash command version of this command!')}\n\n`;
                
                if (param.content && param.content.length + toAdd.length <= 2048) {
                    param.content = `${toAdd}${param.content}`;
                } else {
                    param.content ??= toAdd;
                }
            }
            
            return message.reply(param);
        } catch (e) {
            err = e as Error;

            if (processArgs.get('dev') === true) {
                console.log(e);
            }
            
            if (!(e instanceof Error)) { 
                return;
            } else if (e instanceof DiscordAPIError) {
                // if there's an error sending a message, we should probably
                // not send another message. in the future try figuring out
                // the error code and basing this check off of that.
                return;
            }

            const error = e.name in command.errors 
                ? command.errors[e.name as keyof typeof command.errors] 
                : command.errors.default;
                
            return dontThrow(message.reply({ 
                embeds: [Embed.error(error)],
                failIfNotExists: false
            }));
        } finally {
            MessagesLRU.delete(message.id);

            if (err) {
                logger.error(err);
            } else {
                logger.log(
                    `${message.author.tag} (${message.author.id}) used the ${command.settings.name} command!`,
                    {
                        URL: message.url,
                        guild: message.guild.id,
                        input: `"${message.content}"`
                    }
                );
            }
        }
    }
}