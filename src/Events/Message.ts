import { DiscordAPIError, Message, MessageAttachment, MessageEmbed, ReplyMessageOptions } from 'discord.js';
import { Event } from '../Structures/Event.js';
import { Sanitize } from '../lib/Utility/MessageEvent/SanitizeCommand.js';
import { Logger } from '../Structures/Logger.js';
import { KhafraClient } from '../Bot/KhafraBot.js';
import { trim } from '../lib/Utility/Template.js';
import { cooldown } from '../Structures/Cooldown/GlobalCooldown.js';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { commandLimit, notified } from '../Structures/Cooldown/CommandCooldown.js';
import { Arguments, Command } from '../Structures/Command.js';
import { pool } from '../Structures/Database/Postgres.js';
import { kGuild, PartialGuild } from '../lib/types/KhafraBot.js';
import { client } from '../Structures/Database/Redis.js';
import { upperCase } from '../lib/Utility/String.js';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';
import { createFileWatcher } from '../lib/Utility/FileWatcher.js';
import { cwd } from '../lib/Utility/Constants/Path.js';
import { join } from 'path';
import { Minimalist } from '../lib/Utility/Minimalist.js';
import { Imgur } from '../lib/Utility/MessageEvent/ImgurAlbum.js';
import { Stats } from '../lib/Utility/Stats.js';

const config = {} as typeof import('../../config.json');
createFileWatcher(config, join(cwd, 'config.json'));

const defaultSettings: PartialGuild = {
    prefix: config.prefix,
    max_warning_points: 20,
    mod_log_channel: null,
    welcome_channel: null,
};

const _cooldownGuild = cooldown(30, 60000);
const _cooldownUsers = cooldown(10, 60000);

const processArgs = new Minimalist(process.argv.slice(2).join(' '));

@RegisterEvent
export class kEvent extends Event<'messageCreate'> {
    name = 'messageCreate' as const;
    logger = new Logger('Message');

    async init(message: Message) {
        Stats.messages++;

        if (!Sanitize(message)) return;

        const [name, ...args] = message.content.split(/\s+/g);
    
        let guild: Partial<kGuild> | kGuild | null = null;
        const exists = await client.exists(message.guild.id);
        if (exists === 1) {
            const row = await client.get(message.guild.id);
            guild = Object.assign({ ...defaultSettings }, JSON.parse(row) as Partial<kGuild>);
        } else {
            const { rows } = await pool.query<kGuild>(`
                SELECT * 
                FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [message.guild.id]);

            void client.set(message.guild.id, JSON.stringify(rows[0]), 'EX', 600);

            guild = Object.assign({ ...defaultSettings }, rows.shift());
        }

        const prefix = guild.prefix ?? config.prefix;
        const commandName = name.slice(prefix.length).toLowerCase();
        // !say hello world -> hello world
        const content = message.content.slice(prefix.length + commandName.length + 1);
        const cli = new Minimalist(content);

        if (!name.startsWith(prefix)) {
            const imgur = await Imgur.album([name, ...args]);
            if (imgur === undefined || !Array.isArray(imgur.u) || imgur.u.length === 0) return;

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
                    Embed.success(desc.trim()).setTitle(imgur.t)
                ]
            }));
        }

        if (!KhafraClient.Commands.has(commandName)) return;

        const command = KhafraClient.Commands.get(commandName)!;
        // command cooldowns are based around the commands name, not aliases
        const limited = !commandLimit(command.settings.name, message.author.id);

        if (limited) {
            if (notified.has(message.author.id)) return;

            notified.add(message.author.id);
            return dontThrow(message.reply({
                content: 
                    `${upperCase(command.settings.name)} has a ${command.settings.ratelimit} second rate limit! ` +
                    `Please wait a little bit longer to use the command again. ❤️`
            }));
        }
        
        if (command.settings.ownerOnly && !Command.isBotOwner(message.author.id)) {
            return dontThrow(message.reply({ 
                embeds: [
                    Embed.fail(`\`${command.settings.name}\` is only available to the bot owner!`)
                ] 
            }));
        }

        const [min, max = Infinity] = command.settings.args;
        if (min > args.length || args.length > max) {
            return dontThrow(message.reply({ embeds: [Embed.fail(`
            Incorrect number of arguments provided.
            
            The command requires ${min} minimum arguments and ${max ?? 'no'} max.
            Example(s):
            ${command.help.slice(1).map(c => `\`\`${guild!.prefix}${command.settings.name} ${c || '​'}\`\``.trim()).join('\n')}
            `)] }));
        }

        if (!_cooldownUsers(message.author.id)) {
            return dontThrow(message.reply({ embeds: [Embed.fail(`Users are limited to 10 commands a minute.`)] }));
        } else if (!_cooldownGuild(message.guild.id)) {
            return dontThrow(message.reply({ embeds: [Embed.fail(`Guilds are limited to 30 commands a minute.`)] }));
        } else if (!hasPerms(message.channel, message.member, command.permissions)) {
            return dontThrow(message.reply({ embeds: [Embed.missing_perms(false, command.permissions)] }));
        }

        Stats.session++;

        try {
            const options: Arguments = { args, commandName, content, prefix, cli };
            const returnValue = await command.init(message, options, guild);
            if (!returnValue || returnValue instanceof Message || message.deleted) 
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
            
            return message.reply(param);
        } catch (e) {
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
                embeds: [Embed.fail(error)],
                failIfNotExists: false
            }));
        } finally { 
            this.logger.log(trim`
            Command: ${command.settings.name} 
            | Author: ${message.author.id} 
            | URL: ${message.url} 
            | Guild: ${message.guild?.id ?? 'DMs'} 
            | Input: ${message.content}
            `);
        }
    }
}