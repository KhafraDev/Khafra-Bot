import { DiscordAPIError, Message, MessageAttachment, MessageEmbed, ReplyMessageOptions } from 'discord.js';
import { Event } from '../Structures/Event.js';
import { Sanitize } from '../lib/Utility/SanitizeCommand.js';
import { Logger } from '../Structures/Logger.js';
import { KhafraClient } from '../Bot/KhafraBot.js';
import { trim } from '../lib/Utility/Template.js';
import { cooldown } from '../Structures/Cooldown/GlobalCooldown.js';
import config from '../../config.json';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { commandLimit, notified } from '../Structures/Cooldown/CommandCooldown.js';
import { Arguments } from '../Structures/Command.js';
import { pool } from '../Structures/Database/Postgres.js';
import { kGuild } from '../lib/types/KhafraBot.js';
import { client } from '../Structures/Database/Redis.js';
import { upperCase } from '../lib/Utility/String.js';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';

const defaultSettings: Partial<kGuild> = {
    prefix: config.prefix,
    max_warning_points: 20,
    mod_log_channel: null,
    welcome_channel: null,
    rules_channel: null
};

const _cooldownGuild = cooldown(30, 60000);
const _cooldownUsers = cooldown(10, 60000);

@RegisterEvent
export class kEvent extends Event<'messageCreate'> {
    name = 'messageCreate' as const;
    logger = new Logger('Message');

    async init(message: Message) {
        if (!Sanitize(message)) return;

        const [name, ...args] = message.content.split(/\s+/g);
    
        let guild: Partial<kGuild> | kGuild | null = null;
        const exists = await client.exists(message.guild.id) as 0 | 1;
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

        // matches the start of the string with the prefix defined above
        // captures the command name following the prefix up to a whitespace or end of string
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Groups_and_Ranges#using_named_groups
        const optre = new RegExp(
            // start of string, match the escaped guild's prefix
            `^(?<prefix>${guild.prefix.replace(/([^A-z0-9])/g, '\\$1')})` + 
            // command name is anything up to a whitespace
            // content is everything after the whitespace
            `(?<commandName>[^\\s]+)\\s?(?<content>.*?)$`, 
            'si'
        );
        // there should be no case in which this is null, but we are dealing with regexes
        const optionsMatch = optre.exec(message.content);

        if (!optionsMatch || typeof optionsMatch.groups === 'undefined') return;
        if (!name.startsWith(guild.prefix)) return;
        if (!KhafraClient.Commands.has(optionsMatch.groups.commandName?.toLowerCase())) return;

        const command = KhafraClient.Commands.get(optionsMatch.groups.commandName.toLowerCase());
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
        
        if (command.settings.ownerOnly && !command.isBotOwner(message.author.id)) {
            return dontThrow(message.reply({ 
                embeds: [
                    Embed.fail(`\`${command.settings.name}\` is only available to the bot owner!`)
                ] 
            }));
        }

        const [min, max] = command.settings.args;
        if (min > args.length || args.length > max) {
            return dontThrow(message.reply({ embeds: [Embed.fail(`
            Incorrect number of arguments provided.
            
            The command requires ${min} minimum arguments and ${max ?? 'no'} max.
            Example(s):
            ${command.help.slice(1).map(c => `\`\`${guild.prefix}${command.settings.name} ${c || '​'}\`\``.trim()).join('\n')}
            `)] }));
        }
        
        this.logger.log(trim`
        Command: ${command.settings.name} 
        | Author: ${message.author.id} 
        | URL: ${message.url} 
        | Guild: ${message.guild?.id ?? 'DMs'} 
        | Input: ${message.content}
        `);

        if (!_cooldownUsers(message.author.id)) {
            return dontThrow(message.reply({ embeds: [Embed.fail(`Users are limited to 10 commands a minute.`)] }));
        } else if (!_cooldownGuild(message.guild.id)) {
            return dontThrow(message.reply({ embeds: [Embed.fail(`Guilds are limited to 30 commands a minute.`)] }));
        } else if (!hasPerms(message.channel, message.member, command.permissions)) {
            return dontThrow(message.reply({ embeds: [Embed.missing_perms(false, command.permissions)] }));
        }

        try {
            const options = <Arguments> { args, ...optionsMatch.groups };
            const returnValue = await command.init(message, options, guild);
            if (!returnValue || returnValue instanceof Message || message.deleted) 
                return;

            const param = {
                failIfNotExists: false
            } as ReplyMessageOptions & { split?: false };
            
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
            if (!(e instanceof Error)) 
                return;
            // if there's an error sending a message, we should probably
            // not send another message. in the future try figuring out
            // the error code and basing this check off of that.
            else if (e instanceof DiscordAPIError) 
                return;

            const error = e.name in command.errors 
                ? command.errors[e.name as keyof typeof command.errors] 
                : command.errors.default;
                
            return dontThrow(message.reply({ 
                embeds: [Embed.fail(error)],
                failIfNotExists: false
            }));
        }
    }
}