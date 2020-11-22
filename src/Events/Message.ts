import { Message, ClientEvents, Role } from "discord.js";
import { createRequire } from 'module';

import { Event } from "../Structures/Event.js";
import { Sanitize } from "../lib/Utility/SanitizeCommand.js";
import { pool } from "../Structures/Database/Mongo.js";
import { GuildSettings } from "../lib/types/Collections";
import { Logger } from "../Structures/Logger.js";
import { KhafraClient } from "../Bot/KhafraBot.js";
import { Command } from "../Structures/Command.js";
import { trim } from "../lib/Utility/Template.js";
import { cooldown } from "../Structures/Cooldown/CommandCooldown.js";

const { prefix: defaultPrefix } = createRequire(import.meta.url)('../../config.json');

const _cooldownGuild = cooldown(15, 60000);
const _cooldownUsers = cooldown( 6, 60000);

export default class implements Event {
    name: keyof ClientEvents = 'message';
    logger = new Logger('Message');
    Embed = Command.Embed;

    async init(message: Message) {
        if(!Sanitize(message)) {
            return;
        }
    
        const split = message.content.split(/\s+/g);
        const selfMentioned = new RegExp(`<@!?${message.client.user.id}>`).test(split[0]); // bot mentioned first argument
        const [name, ...args] = selfMentioned ? split.slice(1) : split;
        const isDM = message.channel.type === 'dm';

        if(!name) {
            return;
        } else if(selfMentioned && !KhafraClient.Commands.has(name) && isDM) { // when mentioned, there is no prefix
            return;
        } else if(isDM && (!message.content.startsWith(defaultPrefix) && !selfMentioned)) { // dm, doesn't start with prefix, not mentioned
            return;
        }
    
        const client =      isDM ? null : await pool.settings.connect();
        const collection =  isDM ? null : client.db('khafrabot').collection('settings');
        const guild =       isDM ? null : await collection.findOne<GuildSettings>({ id: message.guild.id });

        const prefix: string = selfMentioned ? '' : (guild?.prefix ?? defaultPrefix);
        const fName = name.toLowerCase().slice(prefix.length);
        if(!selfMentioned && !name.startsWith(prefix)) { // when mentioned, command has no prefix
            return;
        }

        /**
         * Handle command roles, or a custom command that gives the user
         * a role. Set-up by an admin in the server.
         */
        const Custom = guild?.commandRole?.filter(c => c.command === fName);
        if(Array.isArray(Custom) && Custom.length !== 0) {
            const my = message.guild.me.roles.cache.sort((a, b) => b.rawPosition - a.rawPosition).first().rawPosition;
            if(!message.guild.me.permissionsIn(message.channel).has('MANAGE_ROLES')) {
                return message.reply(this.Embed.fail(`
                I am lacking permissions to update user roles! 

                Ask your server's staff to update my permissions if you'd like to use custom commands.
                `));
            }

            const { role, command, message: m } = Custom.shift();
            if(!message.guild.roles.cache.has(role)) {
                return;
            } else if(!message.member.manageable) {
                return message.reply(this.Embed.fail(`I cannot manage your roles!`));
            }

            const roleCache = message.guild.roles.cache.get(role) ?? await message.guild.roles.fetch(role);
            if(!(roleCache instanceof Role) || roleCache.deleted || roleCache.managed) {
                return message.reply(this.Embed.fail(`Role couldn't be fetched!`));
            } else if(roleCache.rawPosition >= my) {
                return message.reply(this.Embed.fail(`
                I cannot add or remove this role as it is equal to or higher than my highest role in the hierarchy.
                `));
            }

            const action = message.member.roles.cache.has(role) ? 'remove' : 'add';
            const ccMessage = action === 'add' 
                ? (m?.replace('{user}', message.member.toString()) ?? `I have given you ${roleCache}!`)
                : `I have taken away ${roleCache}.`;

            try {
                await message.member.roles[action](role);
            } catch(e) {
                this.logger.log(e);
                return message.reply(this.Embed.fail('An unexpected error occurred!'));
            }

            this.logger.log(trim`
            Command: ${command} 
            | Author: ${message.author.id} 
            | URL: ${message.url} 
            | Guild: ${message.guild.id} 
            `);

            return message.reply(this.Embed.success(ccMessage));
        }

        /**
         * Handle command settings and "quirks", making sure command is valid in the environment it's used in.
         */
        const command = KhafraClient.Commands.get(fName);                        
        if(!command) { // no built in or custom command
            return;
        } else if(command.settings.ownerOnly && !command.isBotOwner(message.author.id)) {
            return message.reply(this.Embed.fail(`
            \`\`${command.settings.name}\`\` is only available to the bot owner!
            `));
        } else if(command.settings.guildOnly && isDM) {
            return message.reply(this.Embed.fail(`
            \`\`${command.settings.name}\`\` is only available in guilds!
            `));
        } else {
            const [min, max] = command.settings.args;
            if(min > args.length || args.length > max) {
                return message.reply(this.Embed.fail(`
                Incorrect number of arguments provided.
                
                The command requires ${min} minimum arguments and ${max ?? 'no'} max.
                Example(s):
                ${command.help.slice(1).map(c => `\`\`${prefix}${command.settings.name} ${c || '​'}\`\``.trim()).join('\n')}
                `));
            }
        }

        this.logger.log(trim`
        Command: ${command.settings.name} 
        | Author: ${message.author.id} 
        | URL: ${message.url} 
        | Guild: ${message.guild?.id ?? 'DMs'} 
        | Input: ${message.content}
        `);

        if(!_cooldownUsers(message.author.id)) {
            return message.reply(this.Embed.fail(`
            Users are limited to 6 commands a minute.

            Please refrain from spamming the bot.
            `));
        } else if(message.channel.type !== 'dm') {
            if(!_cooldownGuild(message.guild.id)) {
                return message.reply(this.Embed.fail(`
                Guilds are limited to 15 commands a minute.
    
                Please refrain from spamming the bot.
                `));
            } 
        }

        if(message.guild && ![ 'Settings', 'Moderation' ].includes(command.settings.folder)) { // commands can only be enabled/disabled in guilds.
            const disabledGuild = guild?.disabledGuild?.some(g =>
                g.names.includes('*') || g.names.includes(command.settings.name.toLowerCase())  
            );
            if(disabledGuild) return;

            const disabledChannel = guild?.disabledChannel?.some(c => 
                c.id === message.channel.id && // in this channel
                (c.names.includes('*') || c.names.includes(command.settings.name.toLowerCase())) // * = all commands
            );
            if(disabledChannel) return;

            const disabledRole = guild?.disabledRole?.some(r => 
                message.member.roles.cache.has(r.id) &&
                (r.names.includes('*') || r.names.includes(command.settings.name.toLowerCase())) // * = all commands
            );
            if(disabledRole) return;

            const disabledUser = guild?.disabledUser?.some(u => 
                message.author.id === u.id &&
                (u.names.includes('*') || u.names.includes(command.settings.name.toLowerCase())) // * = all commands
            );
            if(disabledUser) return;
        }

        if(!command.userHasPerms(message, command.permissions)) {
            return message.reply(this.Embed.missing_perms(false, command.permissions));
        }

        return command.init(message, args, guild);
    }
}