import { Event } from "../Structures/Event";
import { Message, PermissionString, ClientEvents } from "discord.js";
import { dbHelpers } from "../Backend/Helpers/GuildSettings";
import KhafraClient from "../Bot/KhafraBot";
import { Sanitize } from "../Backend/Helpers/SanitizeCommand";
import Cooldown from "../Structures/Cooldown";
import Embed from "../Structures/Embed";

export default class implements Event {
    name: keyof ClientEvents = 'message';

    init(message: Message) {
        if(!Sanitize(message)) {
            return;
        }
    
        const split = message.content.split(/\s+/g);
        // don't split a single string if there are no arguments
        const [cmd, ...args] = split.length > 1 ? split : [split].flat();
    
        const settings = dbHelpers.get(message.guild.id, 'reacts, prefix, custom_commands');
        const prefix = settings?.prefix ?? '!';
        const command = KhafraClient.Commands.get(cmd.toLowerCase().slice(prefix.length));

        if(settings?.reacts) {
            const perms = message.guild.me.permissionsIn(message.channel);
            const hasPerms = [
                'READ_MESSAGE_HISTORY',
                'ADD_REACTIONS'
            ] as PermissionString[];
            
            if(!hasPerms.every(perm => perms.has(perm))) {
                return;
            }
    
            const user = settings.reacts.filter(r => r.id === message.author.id).pop();
            if(user) {
                const random = Math.floor(Math.random() * 100 + 1);
                const chance = random <= +user.chance;

                if(chance) {
                    try {
                        message.react(user.emoji.replace(/\\/g, '')); // SQLite sanitizes input, in this case by adding backslashes.
                    } catch {} // doesn't really matter if this fails.
                }
            }
        }

        const blacklisted = settings?.custom_commands.filter(bl => bl.name === command?.name && bl.type === 'blacklist');
        const whitelisted = settings?.custom_commands.filter(wl => wl.name === command?.name && wl.type === 'whitelist');

        if(!command || !cmd?.startsWith(prefix)) {
            return;
        } else if(whitelisted?.length > 0) {
            const { users, channels } = whitelisted.pop();
            
            if(
                users.indexOf(message.author.id) === -1 &&  // user isn't whitelisted
                channels.indexOf(message.channel.id) === -1 // channel isn't whitelisted
            ) {
                return;
            }
        } else if(blacklisted?.length > 0) {
            const { users, channels, guild } = blacklisted.pop();

            if( guild === true || 
                users.indexOf(message.author.id) > -1 || 
                channels.indexOf(message.channel.id) > -1
            ) {
                return;
            }
        } else if(Cooldown.$has(message.author.id, command.name)) {
            return message.channel.send(Embed.fail(`
            Command \`\`${command.name}\`\` has a ${command.cooldown} second cooldown!
            `));
        } else {
            Cooldown.$set(message.author.id, command.name, command.cooldown);
        }
    
        if(!cmd.startsWith(prefix)) {
            return;
        }

        return command['init'](message, args);
    }
}