import { bold, inlineCode } from '@khaf/builders';
import { DiscordAPIError, Message, MessageAttachment, MessageEmbed, ReplyMessageOptions } from 'discord.js';
import { KhafraClient } from '../Bot/KhafraBot.js';
import { MessagesLRU } from '../lib/Cache/Messages.js';
import { isDM } from '../lib/types/Discord.js.js';
import { kGuild } from '../lib/types/KhafraBot.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';
import { Sanitize } from '../lib/Utility/EventEvents/Message_SanitizeCommand.js';
import { Minimalist } from '../lib/Utility/Minimalist.js';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { Stats } from '../lib/Utility/Stats.js';
import { plural, upperCase } from '../lib/Utility/String.js';
import { Arguments, Command } from '../Structures/Command.js';
import { pool } from '../Structures/Database/Postgres.js';
import { client } from '../Structures/Database/Redis.js';
import { Event } from '../Structures/Event.js';
import { config, defaultSettings, disabled, logger, processArgs, _cooldownGuild, _cooldownUsers } from './Message.js';

export class kEvent extends Event<'messageUpdate'> {
    name = 'messageUpdate' as const;

    async init(oldMessage: Message, newMessage: Message) {
        if (!MessagesLRU.has(oldMessage.id)) return;
        if (oldMessage.content === newMessage.content) return;
        if (!Sanitize(newMessage) || isDM(newMessage.channel)) return;

        Stats.messages++;

        const [name, ...args] = newMessage.content.split(/\s+/g);
    
        let guild!: typeof defaultSettings | kGuild;
        const row = await client.get(newMessage.guild.id);

        if (row) {
            guild = { ...defaultSettings, ...JSON.parse(row) as kGuild };
        } else {
            const { rows } = await pool.query<kGuild>(`
                SELECT * 
                FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [newMessage.guild.id]);

            if (rows.length !== 0) {
                void client.set(newMessage.guild.id, JSON.stringify(rows[0]), 'EX', 600);

                guild = { ...defaultSettings, ...rows.shift() };
            } else {
                guild = { ...defaultSettings };
            }
        }

        const prefix = guild?.prefix ?? config.prefix;
        const commandName = name.slice(prefix.length).toLowerCase();
        // !say hello world -> hello world
        const content = newMessage.content.slice(prefix.length + commandName.length + 1);
        const cli = new Minimalist(content);

        if (!name.startsWith(prefix)) return;
        if (!KhafraClient.Commands.has(commandName)) return;

        const command = KhafraClient.Commands.get(commandName)!;
        // command cooldowns are based around the commands name, not aliases
        const limited = command.rateLimit.isRateLimited(newMessage.author.id);

        if (limited) {
            if (command.rateLimit.isNotified(newMessage.author.id)) return;

            const cooldownInfo = command.rateLimit.get(newMessage.author.id)!;
            const rateLimitSeconds = command.rateLimit.rateLimitSeconds;
            const delay = rateLimitSeconds - ((Date.now() - cooldownInfo.added) / 1_000);

            return dontThrow(newMessage.reply({
                content: 
                    `${upperCase(command.settings.name)} has a ${rateLimitSeconds} second rate limit! ` +
                    `Please wait ${delay.toFixed(2)} second${plural(Number(delay.toFixed(2)))} to use this command again! ❤️`
            }));
        } else if (disabled.includes(command.settings.name) || command.settings.aliases?.some(c => disabled.includes(c))) {
            return void dontThrow(newMessage.reply({
                content: `${inlineCode(commandName)} is temporarily disabled!`
            }));
        } else if (!limited) {
            command.rateLimit.rateLimitUser(newMessage.author.id);
        }
        
        if (command.settings.ownerOnly && !Command.isBotOwner(newMessage.author.id)) {
            return dontThrow(newMessage.reply({ 
                embeds: [
                    Embed.fail(`\`${command.settings.name}\` is only available to the bot owner!`)
                ] 
            }));
        }

        const [min, max = Infinity] = command.settings.args;
        if (min > args.length || args.length > max) {
            return dontThrow(newMessage.reply({ embeds: [Embed.fail(`
            Incorrect number of arguments provided.
            
            The command requires ${min} minimum arguments and ${max ?? 'no'} max.
            Example(s):
            ${command.help.slice(1).map(c => inlineCode(`${guild.prefix}${command.settings.name} ${c || '​'}`.trim())).join('\n')}
            `)] }));
        }

        if (!_cooldownUsers(newMessage.author.id)) {
            return dontThrow(newMessage.reply({ embeds: [Embed.fail(`Users are limited to 10 commands a minute.`)] }));
        } else if (!_cooldownGuild(newMessage.guild.id)) {
            return dontThrow(newMessage.reply({ embeds: [Embed.fail(`Guilds are limited to 30 commands a minute.`)] }));
        } else if (!hasPerms(newMessage.channel, newMessage.member, command.permissions)) {
            return dontThrow(newMessage.reply({ embeds: [Embed.missing_perms(false, command.permissions)] }));
        }

        let err: Error | void;
        Stats.session++;

        try {
            const options: Arguments = { args, commandName, content, prefix, cli };
            const returnValue = await command.init(newMessage, options, guild);
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
            
            return newMessage.reply(param);
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
                
            return dontThrow(newMessage.reply({ 
                embeds: [Embed.fail(error)],
                failIfNotExists: false
            }));
        } finally {
            MessagesLRU.remove(newMessage.id);

            if (err) {
                logger.error(err);
            } else {
                logger.log(
                    `${newMessage.author.tag} (${newMessage.author.id}) used the ${command.settings.name} command!`,
                    {
                        URL: newMessage.url,
                        guild: newMessage.guild.id,
                        input: `"${newMessage.content}"`
                    }
                );
            }
        }
    }
}