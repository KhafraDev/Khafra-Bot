import { Event } from "../Structures/Event";
import { Message, ClientEvents, Role } from "discord.js";
import KhafraClient from "../Bot/KhafraBot";
import { Sanitize } from "../lib/Utility/SanitizeCommand";
import { Cooldown } from "../Structures/Cooldown";
import Embed from "../Structures/Embed";
import { pool } from "../Structures/Database/Mongo";
import { GuildSettings } from "../lib/types/Collections";

const cooldown = new Cooldown();

export default class implements Event {
    name: keyof ClientEvents = 'message';

    async init(message: Message) {
        // Sanitize checks:
        //  * Author is a bot
        //  * If there is a guild, if it's available
        //  * If the message is partial or is a system message.
        //  * If bot has perms in text channel (DMs aren't checked)
        if(!Sanitize(message)) {
            return;
        }
    
        const split = message.content.split(/\s+/g);
        // don't split a single string if there are no arguments
        const [cmd, ...args] = split.length > 1 ? split : [split].flat();

        if(!/[^A-z0-9]/.test(cmd[0]) || !/[A-z0-9]/.test(cmd)) {
            // command doesn't start with a valid prefix (non-alphanumeric character)
            // or the command has no alpha-numeric characters in it
            return;
        }
    
        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');
        const guild = await collection.findOne({ id: message.guild?.id ?? message.channel.id }) as GuildSettings;

        const prefix: string = guild?.prefix ?? '!'; // default prefix to `!` if one doesn't exist
        const name = cmd.toLowerCase().slice(prefix.length); // name of the command
        const command = KhafraClient.Commands.get(name);

        // handle commands in DM channels up here
        // since everything below this is only enabled in guilds
        // -> custom commands, disabled/enabled commands, ...
        if(message.channel.type === 'dm') {
            if(cmd.indexOf(prefix) === 0 && !command.settings.guildOnly) {
                return command.init(message, args);
            } else if(command.settings.guildOnly) {
                return message.author.send(Embed.fail('Command is only available in guilds!'))
                    .catch(() => {}); // if user has direct DMs disabled, an error will be thrown
            } else {
                return;
            }
        } else if(cmd.indexOf(prefix) !== 0) { // supposed command doesn't start with prefix
            return;
        } else if(!guild && !command) { // no custom commands and no command found
            return;
        }

        if(guild) {
            const customCommands = guild.commandRole
                ?.filter(c => c.command === name)
                .shift();
            
            if(customCommands) { // custom commands are guild only
                const r = await message.guild.roles.fetch(customCommands.role);
            
                // RoleManager.fetch can return Role | null | RoleManager.
                // so we check if it was fetched, it is a role, it is not managed
                // and not deleted. No other manager behaves like this.
                if(!r || !(r instanceof Role) || r.managed || r.deleted) { 
                    return;
                } else {
                    if(!message.member.manageable) { // client doesn't have perms to manage user
                        return;
                    } 

                    if(message.member.roles.cache.has(r.id)) { // if user has role, remove it
                        return message.member.roles.remove(r).catch(() => {}); // so errors don't crash process
                    } else {
                        return message.member.roles.add(r).catch(() => {}) // so errors don't crash process
                    }
                }
            }

            // handle disabled and enabled command(s)
            // type can be Role | GuildMember | TextChannel
            // id is Snowflake | null (for guilds)
            const disabled = guild?.disabled?.filter(d => d.command === name || d.aliases.indexOf(name) > -1);
            for(const disabledFor of disabled ?? []) {
                if( (disabledFor.type === 'user'    && disabledFor.id === message.author.id)           ||
                    (disabledFor.type === 'role'    && message.member.roles.cache.has(disabledFor.id)) ||
                    (disabledFor.type === 'channel' && message.channel.id === disabledFor.id)          ||
                    disabledFor.type === 'guild'
                ) {
                    return;
                } 
            }

            const enabled = guild?.enabled?.filter(e => e.command === name || e.aliases.indexOf(name) > -1);
            const isEnabled = enabled?.some(enabledFor => {
                if( (enabledFor.type === 'user'    && enabledFor.id === message.author.id)           ||
                    (enabledFor.type === 'role'    && message.member.roles.cache.has(enabledFor.id)) ||
                    (enabledFor.type === 'channel' && message.channel.id === enabledFor.id)          ||
                    enabledFor.type === 'guild'
                ) {
                    return true;
                } 
            });
            
            // command is in enabled list, it is a boolean (can be undefined because of optional chaining) 
            // and is explicitly false
            if(enabled?.length > 0 && typeof isEnabled === 'boolean' && isEnabled === false) {
                return;
            }
        }
        
        const user_cd = cooldown.has(command.settings.name, message.author.id);
        if(user_cd) {
            return message.channel.send(Embed.fail(`
            Command \`\`${command.settings.name}\`\` has a ${command.settings.cooldown} second cooldown!
            
            Please wait \`\`${(user_cd.seconds - ((Date.now() - user_cd.time) / 1000)).toFixed(2)}\`\` seconds to use this command again!
            `));
        } else {
            cooldown.set(message.author.id, command.settings.name, command.settings.cooldown);
        }

        return command.init(message, args);
    }
}