import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { type UnsafeEmbedBuilder } from '@discordjs/builders';
import { PermissionFlagsBits } from 'discord-api-types/v10';
import type { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Find out why the server owner doesn\'t have a crown icon!'
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

    async init (message: Message<true>): Promise<UnsafeEmbedBuilder> {
        let desc = 'For the server owner to regain the crown icon, the following roles must have admin perms removed, or must be unhoisted:\n';
        const next = 'It is recommended to have a role with admin perms that is not hoisted, and have separate role(s) without perms that are hoisted!';
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
            return Embed.error('The server owner already has a crown! Refresh your client to see it. 👑');
        }

        desc += next;

        return Embed.ok(desc);
    }
}