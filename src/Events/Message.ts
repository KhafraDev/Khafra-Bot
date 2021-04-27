import { DiscordAPIError, Message } from 'discord.js';
import { Event } from '../Structures/Event.js';
import { Sanitize } from '../lib/Utility/SanitizeCommand.js';
import { pool } from '../Structures/Database/Mongo.js';
import { GuildSettings } from '../lib/types/Collections';
import { Logger } from '../Structures/Logger.js';
import { KhafraClient } from '../Bot/KhafraBot.js';
import { trim } from '../lib/Utility/Template.js';
import { cooldown } from '../Structures/Cooldown/GlobalCooldown.js';
import config from '../../config.json';
import { isDM } from '../lib/types/Discord.js.js';
import { hasPerms } from '../lib/Utility/Permissions.js';
import { Embed } from '../lib/Utility/Constants/Embeds.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { commandLimit } from '../Structures/Cooldown/CommandCooldown.js';
import { Arguments } from '../Structures/Command.js';

const defaultSettings: Partial<GuildSettings> = {
    prefix: config.prefix,
    whitelist: [],
    blacklist: []
};

const _cooldownGuild = cooldown(30, 60000);
const _cooldownUsers = cooldown(10, 60000);

@RegisterEvent
export class kEvent extends Event {
    name = 'message' as const;
    logger = new Logger('Message');

    async init(message: Message) {
        if (!Sanitize(message)) return;

        const [name, ...args] = message.content.split(/\s+/g);
    
        const client =      isDM(message.channel) ? null : await pool.settings.connect();
        const collection =  isDM(message.channel) ? null : client.db('khafrabot').collection('settings');
        const guild =       isDM(message.channel) 
            ? defaultSettings 
            : Object.assign({ ...defaultSettings }, await collection.findOne<GuildSettings>({ id: message.guild.id }));

        // matches the start of the string with the prefix defined above
        // captures the command name following the prefix up to a whitespace or end of string
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Groups_and_Ranges#using_named_groups
        const optre = new RegExp(`^(?<prefix>${guild.prefix})(?<commandName>[A-z0-9:_]+)\\s?(?<content>.*?)$`, 'si');
        // there should be no case in which this is null, but we are dealing with regexes
        const optionsMatch = message.content.match(optre)!;

        if (!optionsMatch || typeof optionsMatch.groups === 'undefined') return;
        if (!name.startsWith(guild.prefix)) return;
        if (!KhafraClient.Commands.has(optionsMatch.groups!.commandName.toLowerCase())) return;

        const command = KhafraClient.Commands.get(optionsMatch.groups!.commandName.toLowerCase());
        // command cooldowns are based around the commands name, not aliases
        if (!commandLimit(command.settings.name, message.author.id)) return;

        /** Check blacklist/whitelist status of command */
        if (!['Settings', 'Moderation'].includes(command.settings.folder)) {
            if (guild.whitelist.length > 0 && !guild.whitelist.includes(command.settings.name))
                return message.reply(Embed.fail('This command has not been whitelisted!'));
            if (guild.blacklist.includes(command.settings.name)) 
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
            ${command.help.slice(1).map(c => `\`\`${guild.prefix}${command.settings.name} ${c || '​'}\`\``.trim()).join('\n')}
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
            return message.reply(Embed.fail(`Users are limited to 10 commands a minute.`));
        } else if (!isDM(message.channel)) {
            if (!_cooldownGuild(message.guild.id)) {
                return message.reply(Embed.fail(`Guilds are limited to 30 commands a minute.`));
            } 
        }

        if (!hasPerms(message.channel, message.member, command.permissions)) {
            return message.reply(Embed.missing_perms(false, command.permissions));
        }

        try {
            const options = <Arguments> { args, ...optionsMatch.groups! };
            const returnValue = await command.init(message, options, guild);
            if (!returnValue || returnValue instanceof Message || message.deleted) 
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