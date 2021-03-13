import { DiscordAPIError, Message } from 'discord.js';
import { Event } from '../Structures/Event.js';
import { Sanitize } from '../lib/Utility/SanitizeCommand.js';
import { pool } from '../Structures/Database/Mongo.js';
import { GuildSettings } from '../lib/types/Collections';
import { Logger } from '../Structures/Logger.js';
import { KhafraClient } from '../Bot/KhafraBot.js';
import { trim } from '../lib/Utility/Template.js';
import { cooldown } from '../Structures/Cooldown/CommandCooldown.js';
import config from '../../config.json';
import { client as kClient } from '../index.js';
import { isDM } from '../lib/types/Discord.js.js';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { RegisterEvent } from '../Structures/Decorator.js';

const { prefix: defaultPrefix } = config;

const _cooldownGuild = cooldown(15, 60000);
const _cooldownUsers = cooldown( 6, 60000);

let mentioned: RegExp | null = null;

@RegisterEvent
export class kEvent extends Event {
    name = 'message' as const;
    logger = new Logger('Message');

    async init(message: Message) {
        if (!Sanitize(message)) return;

        const split = message.content.split(/\s+/g);
        const selfMentioned = (mentioned ??= new RegExp(`<@!?${kClient.user.id}>`)).test(split[0]); // bot mentioned first argument
        const [name, ...args] = selfMentioned ? split.slice(1) : split;

        if (!name) return;
    
        const client =      isDM(message.channel) ? null : await pool.settings.connect();
        const collection =  isDM(message.channel) ? null : client.db('khafrabot').collection('settings');
        const guild =       isDM(message.channel) ? null : await collection.findOne<GuildSettings>({ id: message.guild.id });

        const prefix = selfMentioned ? '' : (guild?.prefix ?? defaultPrefix);
        const fName = name.toLowerCase().slice(prefix.length);
        if (!name.startsWith(prefix)) return; // 'hello'.startsWith('') = true
        if (!KhafraClient.Commands.has(fName)) return;

        const command = KhafraClient.Commands.get(fName);

        /** Check blacklist/whitelist status of command */
        if (!['Settings', 'Moderation'].includes(command.settings.folder)) {
            if (guild?.whitelist?.length > 0 && !guild?.whitelist?.includes(command.settings.name))
                return message.reply(Embed.fail('This command has not been whitelisted!'));
            if (guild?.blacklist?.includes(command.settings.name)) 
                return message.reply(Embed.fail('This command has been disabled by an administrator!'));
        }
        
        if (command.settings.ownerOnly && !command.isBotOwner(message.author.id)) {
            return message.reply(Embed.fail(`
            \`\`${command.settings.name}\`\` is only available to the bot owner!
            `));
        } else if (command.settings.guildOnly && isDM(message.channel)) {
            return message.reply(Embed.fail(`
            \`\`${command.settings.name}\`\` is only available in guilds!
            `));
        } 

        const [min, max] = command.settings.args;
        if (min > args.length || args.length > max) {
            return message.reply(Embed.fail(`
            Incorrect number of arguments provided.
            
            The command requires ${min} minimum arguments and ${max ?? 'no'} max.
            Example(s):
            ${command.help.slice(1).map(c => `\`\`${prefix}${command.settings.name} ${c || '​'}\`\``.trim()).join('\n')}
            `));
        }
        
        this.logger.log(trim`
        Command: ${command.settings.name} 
        | Author: ${message.author.id} 
        | URL: ${message.url} 
        | Guild: ${message.guild?.id ?? 'DMs'} 
        | Input: ${message.content}
        `);

        if (!_cooldownUsers(message.author.id)) {
            return message.reply(Embed.fail(`
            Users are limited to 6 commands a minute.

            Please refrain from spamming the bot.
            `));
        } else if (message.channel.type !== 'dm') {
            if (!_cooldownGuild(message.guild.id)) {
                return message.reply(Embed.fail(`
                Guilds are limited to 15 commands a minute.
    
                Please refrain from spamming the bot.
                `));
            } 
        }

        if (!hasPerms(message.channel, message.member, command.permissions)) {
            return message.reply(Embed.missing_perms(false, command.permissions));
        }

        try {
            const returnValue = await command.init(message, args, guild);
            if (!returnValue || returnValue instanceof Message) 
                return;
            
            return message.reply(returnValue);
        } catch (e) {
            // if there's an error sending a message, we should probably
            // not send another message. in the future try figuring out
            // the error code and basing this check off of that.
            if (e instanceof DiscordAPIError) 
                return;

            const error = e.name in command.errors 
                ? command.errors[e.name as keyof typeof command.errors] 
                : command.errors.default;
                
            return message.reply(Embed.fail(error))
                .catch(() => {});
        }
    }
}