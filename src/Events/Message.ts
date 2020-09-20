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
import { readFileSync } from "fs";
import { join } from "path";
import Embed from "../Structures/Embed";
import { inspect } from "util";
import { Command } from "../Structures/Command";
import { GuildCooldown } from "../Structures/Cooldown/GuildCooldown";

const { prefix: defaultPrefix }: { prefix: string } = JSON.parse(
    readFileSync(join(__dirname, '../../config.json')).toString()
);

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

        // number of characters to slice off command name. 
        const prefixLength = selfMentioned ? 0 : isDM ? defaultPrefix.length : (guild?.prefix?.length ?? defaultPrefix.length);
        const command = KhafraClient.Commands.get(commandName.slice(prefixLength))
                        ?? guild?.commandRole?.filter(c => c.command === commandName.slice(prefixLength)) 
                        
        if(!command || (Array.isArray(command) && command.length === 0)) { // no built in or custom command
            return;
        }

        this.logger.log(`
        Command: ${Array.isArray(command) ? `Custom: ${command[0].command}` : command.settings.name} 
        | Author: ${message.author.id} 
        | URL: ${message.url} 
        | Guild: ${message.guild?.id ?? 'DMs'} 
        | Input: ${message.content}
        `.split(/\n\r|\n|\r/g).map(e => e.trim()).join(' ').trim());

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

        if(command instanceof Command) {
            const name = command.settings.name.toLowerCase();
            const [min, max] = command.settings.args;
            if(min > args.length || args.length > max) {
                return message.channel.send(Embed.fail(`
                Incorrect number of arguments provided.
                
                The command requires ${min} minimum arguments and ${max ?? 'no'} max.
                Use \`\`help ${name}\`\` for example usage!
                `));
            }

            const enabled =  guild?.enabled?.some(en => 
                (en.command === name || en.aliases?.indexOf(name) > -1) &&
                ((en.type === 'user' && message.author.id === en.id) || 
                (en.type === 'role' && message.member?.roles.cache.has(en.id)) ||
                (en.type === 'channel' && message.channel.id === en.id))
            ) ?? true;
            const disabled = guild?.disabled?.some(di => 
                (di.command === name || di.aliases?.indexOf(name) > -1) &&
                (di.type === 'guild' ||
                (di.type === 'user' && message.author.id === di.id) || 
                (di.type === 'role' && message.member?.roles.cache.has(di.id)) ||
                (di.type === 'channel' && message.channel.id === di.id))
            ) ?? false;

            if(!enabled && guild?.enabled?.filter(en => en.command === name || en.aliases?.indexOf(name) > -1).length > 0) {
                return;
            } else if(!enabled && disabled) { // not enabled for user and is disabled
                return;
            }

            return command.init(message, args);
        }

        // guild is guaranteed to be defined here
        // and the command isn't in dms
        // and command is a guaranteed custom command

        const custom = command.filter(e => e.command === commandName.slice(prefixLength));
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
                this.logger.log(inspect(e));
                return message.channel.send(Embed.fail('An unexpected error occurred!'));
            }

            return message.channel.send(Embed.success(ccMessage));
        }
    }
}