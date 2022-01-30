import { Command } from '#khaf/Command';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { PermissionFlagsBits } from 'discord-api-types/v9';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Find out why the server owner doesn\'t have a crown!'
            ],
			{
                name: 'lostcrown',
                folder: 'Server',
                aliases: ['crown', 'crownlost'],
                args: [0, 0],
                ratelimit: 3,
                guildOnly: true
            }
        );
    }

    async init(message: Message<true>) {
        let desc = `For the server owner to regain the crown icon, the following roles must have admin perms removed, or must be unhoisted:\n`;
        const next = `It is recommended to have a role with admin perms that is not hoisted, and have separate role(s) without perms that are hoisted!`;
        let amount = 0;

        for (const role of message.guild.roles.cache.values()) {
            if (
                hasPerms(message.channel, role, PermissionFlagsBits.Administrator) &&
                role.hoist
            ) {
                const line = `${role}\n`;
                if (desc.length + next.length + line.length > 2048) break;
                desc += line;
                amount++;
            }
        }

        if (amount === 0) {
            return this.Embed.error(`The server owner already has a crown! Refresh your client to see it. 👑`);
        }

        desc += next;

        return this.Embed.ok(desc);
    }
}