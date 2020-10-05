import { Event } from "../Structures/Event";
import { 
    Message, 
    ClientEvents,
    Role
} from "discord.js";
import { Sanitize } from "../lib/Utility/SanitizeCommand";
import { pool } from "../Structures/Database/Mongo";
import { GuildSettings } from "../lib/types/Collections";
import { Logger } from "../Structures/Logger";
import KhafraClient from "../Bot/KhafraBot";
import { Command } from "../Structures/Command";
import { GuildCooldown } from "../Structures/Cooldown/GuildCooldown";

import { prefix as defaultPrefix } from '../../config.json';
import { trim } from "../lib/Utility/Template";

const Embed = Command.Embed;

const cooldownGuild = new GuildCooldown();
const cooldownUsers = new GuildCooldown(7);

export default class implements Event {
    name: keyof ClientEvents = 'message';
    logger = new Logger('Message');

    async init(message: Message) {
        if(!Sanitize(message)) {
            return;
        }
    
        const split = message.content.split(/\s+/g);
        const selfMentioned = new RegExp(`<@!?${message.client.user.id}>`).test(split[0]); // bot mentioned first argument
        const [commandName, ...args] = selfMentioned ? split.slice(1) : split;
        const isDM = message.channel.type === 'dm';

        if(!commandName) {
            return;
        } else if(selfMentioned && !KhafraClient.Commands.has(commandName) && isDM) { // when mentioned, there is no prefix
            return;
        } else if(isDM && (!message.content.startsWith(defaultPrefix) && !selfMentioned)) { // dm, doesn't start with prefix, not mentioned
            return;
        }
    
        const client =      isDM ? null : await pool.settings.connect();
        const collection =  isDM ? null : client.db('khafrabot').collection('settings');
        const guild =       isDM ? null : await collection.findOne({ id: message.guild.id }) as GuildSettings;

        const prefix = selfMentioned ? null : isDM ? defaultPrefix : (guild?.prefix ?? defaultPrefix);
        if(!selfMentioned && !commandName.startsWith(prefix)) { // when mentioned, command has no prefix
            return;
        }

        // get a built-in command or try getting a custom guild command
        const command = KhafraClient.Commands.get(commandName.slice(prefix?.length ?? 0))
                        ?? guild?.commandRole?.filter(c => c.command === commandName.slice(prefix?.length ?? 0)) 
                        
        if(!command || (Array.isArray(command) && command.length === 0)) { // no built in or custom command
            return;
        } else if(command instanceof Command && message.channel.type === 'dm') { // custom commands can't be in DMs
            const reason = command.settings.guildOnly === true
                ? 'in guilds!'
                : command.settings.ownerOnly === true
                    ? 'for the owner!'
                    : null;

            if(reason) {
                // sending a message to a user can fail depending on their settings.
                try { 
                    return message.author.send(Embed.fail(`\`\`${command.settings.name}\`\` is only available ${reason}!`));
                } catch {
                    return; // whatever, doesn't bother us
                }
            }
        } 

        this.logger.log(trim`
        Command: ${Array.isArray(command) ? `Custom: ${command[0].command}` : command.settings.name} 
        | Author: ${message.author.id} 
        | URL: ${message.url} 
        | Guild: ${message.guild?.id ?? 'DMs'} 
        | Input: ${message.content}
        `);

        cooldownGuild.set(message.guild?.id ?? message.channel.id); // set cooldowns for guild/DM channel
        cooldownUsers.set(message.author.id); // set cooldowns for Users
        if(cooldownGuild.limited(message.guild?.id ?? message.channel.id)) {
            return message.channel.send(Embed.fail(`
            ${message.channel.type === 'dm' ? 'DMs' : 'Guilds'} are limited to ${cooldownGuild.MAX} commands a minute.

            Please refrain from spamming the bot.
            `));
        } else if(command && cooldownUsers.limited(message.author.id)) {
            return message.channel.send(Embed.fail(`
            Users are limited to ${cooldownUsers.MAX} commands a minute.

            Please refrain from spamming the bot.
            `));
        }

        const name = command instanceof Command ? command.settings.name.toLowerCase() : command[0].command.toLowerCase();
        if(message.guild) { // commands can only be enabled/disabled in guilds.
            // get all "enabled" commands in the guild (if there are any)
            const enabledForType =  guild?.enabled?.filter(en => en.command === name || en.aliases?.includes(name)) ?? [];
            const disabled = guild?.disabled?.some(di => 
                (di.command === name || di.aliases?.indexOf(name) > -1) &&
                (di.type === 'guild' ||
                (di.type === 'user' && message.author.id === di.id) || 
                (di.type === 'role' && message.member?.roles.cache.has(di.id)) ||
                (di.type === 'channel' && message.channel.id === di.id))
            ) ?? false;

            if(message.guild && enabledForType.length !== 0) {
                const enabled = enabledForType.some(en => // name/aliases don't need to be checked
                    (en.type === 'user' && en.id === message.author.id) ||
                    (en.type === 'role' && message.member.roles.cache.has(en.id)) ||
                    (en.type === 'channel' && en.id === message.channel.id)
                );
                
                if(enabled === false) { 
                    // if a command is enabled, only that group type can use it
                    // if this check is explicitly false, the person cannot use it
                    return;
                }
            } else if(disabled) { // not enabled for user and is disabled
                return;
            }
        }

        if(command instanceof Command) {
            const [min, max] = command.settings.args;
            if(min > args.length || args.length > max) {
                return message.channel.send(Embed.fail(`
                Incorrect number of arguments provided.
                
                The command requires ${min} minimum arguments and ${max ?? 'no'} max.
                Use \`\`help ${name}\`\` for example usage!
                `));
            }

            if(!command.userHasPerms(message, command.permissions)) {
                return message.channel.send(Embed.missing_perms(false, command.permissions));
            }

            return command.init(message, args);
        }

        // guild is guaranteed to be defined here
        // and the command isn't in dms
        // and command is a guaranteed custom command

        const custom = command.filter(e => e.command === commandName.slice(prefix?.length ?? 0));
        if(custom.length > 0) {
            const current = custom.shift();
            const role = await message.guild.roles.fetch(current.role);

            if(!(role instanceof Role) || role.deleted || role.managed) {
                return;
            } else if(!message.member.manageable) {
                return message.channel.send(Embed.fail('I can\'t update your roles!'));
            }

            const action = message.member.roles.cache.has(role.id) ? 'remove' : 'add';
            const ccMessage = action === 'add' 
                ? (current.message?.replace('{user}', message.member.toString()) ?? `I have given you ${role}!`)
                : `I have taken away ${role}.`;

            try {
                await message.member.roles[action](role.id);
            } catch(e) {
                this.logger.log(e);
                return message.channel.send(Embed.fail('An unexpected error occurred!'));
            }

            return message.channel.send(Embed.success(ccMessage));
        }
    }
}