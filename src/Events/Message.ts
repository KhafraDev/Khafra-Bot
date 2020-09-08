import { Event } from "../Structures/Event";
import { 
    Message, 
    ClientEvents,
    Role, 
} from "discord.js";
import KhafraClient from "../Bot/KhafraBot";
import { Sanitize } from "../lib/Utility/SanitizeCommand";
import { pool } from "../Structures/Database/Mongo";
import { GuildSettings } from "../lib/types/Collections";
import { Logger } from "../Structures/Logger";
import { GuildCooldown } from "../Structures/Cooldown/GuildCooldown";
import Embed from "../Structures/Embed";
import { readFileSync } from "fs";
import { join } from "path";

const { prefix: defaultPrefix }: { prefix: string } = JSON.parse(
    readFileSync(join(__dirname, '../../config.json')).toString()
);

const cooldownGuild = new GuildCooldown();
const cooldownUsers = new GuildCooldown(5);
const cooldownCustom = new GuildCooldown(5);

export default class implements Event {
    name: keyof ClientEvents = 'message';
    logger = new Logger('Message');

    async init(message: Message) {
        const isDM = message.channel.type === 'dm';
        // Sanitize checks:
        //  * Author is a bot
        //  * If there is a guild, if it's available
        //  * If the message is partial or is a system message.
        //  * If bot has perms in text channel (DMs aren't checked)
        if(!Sanitize(message)) {
            return;
        }
    
        const [commandName, ...args] = message.content.split(/\s+/g);
    
        const client =      isDM ? null : await pool.settings.connect();
        const collection =  isDM ? null : client.db('khafrabot').collection('settings');
        const guild =       isDM ? null : await collection.findOne({ id: message.guild.id }) as GuildSettings;

        /** Guild prefix, defaults to ``!`` */
        const prefix = guild?.prefix ?? defaultPrefix;
        /** Name of the command with the prefix stripped */
        const name = commandName.toLowerCase().slice(prefix.length);
        const command = KhafraClient.Commands.get(name);

        if(commandName.indexOf(prefix) !== 0) {
            return;
        } else if(command) {
            const [min, max] = command.settings.args;
            if(min > args.length || args.length > max) {
                return message.channel.send(Embed.fail(`
                Incorrect number of arguments provided.
                
                The command requires ${command.settings.args[0]} minimum arguments and ${command.settings.args[1] ?? 'no'} max.
                Use \`\`help ${command.settings.name}\`\` for example usage!
                `));
            }
        }

        this.logger.log(`
        Command: ${command?.settings?.name ?? 'Not valid'} 
        | Author: ${message.author.id} 
        | URL: ${message.url} 
        | Guild: ${message.guild?.id ?? 'DMs'} 
        | Input: ${message.content}
        `.split(/\n\r|\n|\r/g).map(e => e.trim()).join(' ').trim());

        cooldownGuild.set(message.guild?.id ?? message.channel.id); // set cooldowns for guild/DM channel
        command && cooldownUsers.set(message.author.id); // set cooldowns for Users
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

        if(command?.settings.guildOnly && message.channel.type === 'dm') { // command is guild only but used in DMs
            return message.channel.send(Embed.fail('Command only works in Guilds!'));
        }

        if(guild) {
            const custom =   guild.commandRole?.filter(cc => cc.command === name);
            const enabled =  guild.enabled?.filter(en => en.command === name || en.aliases?.indexOf(name) > -1);
            const disabled = guild.disabled?.filter(di => di.command === name || di.aliases?.indexOf(name) > -1);

            if(enabled?.length > 0) {
                // can't be enabled for the entire guild because it already is by default.
                if(!enabled.some(t =>
                       t.type === 'user' && message.author.id === t.id
                    || t.type === 'role' && message.member.roles.cache.has(t.id)
                    || t.type === 'channel' && message.channel.id === t.id 
                )) {
                    return;
                }
            }

            if(disabled?.length > 0) {
                if(disabled.some(t => 
                       t.type === 'guild'
                    || t.type === 'user' && message.author.id === t.id
                    || t.type === 'role' && message.member.roles.cache.has(t.id)
                    || t.type === 'channel' && message.channel.id === t.id    
                )) {
                    return;
                }
            }

            // user used a custom command!
            // undefined > 0 === false
            if(custom?.length > 0) {
                if(cooldownCustom.set(message.author.id).limited(message.author.id)) {
                    return message.channel.send(Embed.fail(`
                    Users are limited to ${cooldownCustom.MAX} custom commands a minute.

                    Please refrain from spamming the bot.
                    `));
                } else if(!message.member.manageable) { // bot doesn't have perms to give member role
                    return message.channel.send(Embed.fail(`I do not have sufficient perms to manage ${message.member}!`));
                }

                const role = await message.guild.roles.fetch(custom[0].role);
                // RoleManager can return Role | null | RoleManager
                // check if it's a role, not deleted, and not managed by a third party.
                if(!(role instanceof Role) || role.deleted || role.managed) {
                    return;
                }

                const action = message.member.roles.cache.has(role.id) ? 'remove' : 'add';
                const ccMessage = action === 'add' 
                    ? (custom[0].message?.replace('{user}', message.member.toString()) ?? `I have given you ${role}!`)
                    : `I have taken away ${role}.`;

                try {
                    await Promise.allSettled([
                        message.member.roles[action](role),
                        message.channel.send(Embed[action === 'add' ? 'success' : 'fail'](ccMessage))
                    ]);
                } catch(e) {
                    this.logger.log(`Custom commands: ${e.toString()}`);
                } 

                return;
            }
        }

        if(!command) { // already checked custom commands
            return;
        }

        return command.init(message, args);
    }
}