import { Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { Message } from '../../lib/types/Discord.js.js';
import { Permissions } from 'discord.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Play a game in VC!',
                '866022233330810930 [channel id]',
                '#general [channel mention]'
            ],
			{
                name: 'lostcrown',
                folder: 'Server',
                aliases: ['crown', 'crownlost'],
                args: [0, 0],
                ratelimit: 3
            }
        );
    }

    async init(message: Message) {
        let desc = `For the server owner to regain the crown icon, the following roles must have admin perms removed, or must be unhoisted:\n`;
        const next = `It is recommended to have a role with admin perms that is not hoisted, and have separate role(s) without perms that are hoisted!`;

        for (const role of message.guild.roles.cache.values()) {
            if (
                hasPerms(message.channel, role, [ Permissions.FLAGS.ADMINISTRATOR ]) &&
                role.hoist
            ) {
                const line = `${role}\n`;
                if (desc.length + next.length + line.length > 2048) break;
                desc += line;
            }
        }

        desc += next;

        return this.Embed.success(desc);
    }
}