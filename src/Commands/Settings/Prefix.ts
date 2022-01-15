import { cache } from '#khaf/cache/Settings.js';
import { Arguments, Command } from '#khaf/Command';
import { sql } from '#khaf/database/Postgres.js';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { inlineCode } from '@khaf/builders';
import { Message, Permissions } from 'discord.js';

export class kCommand extends Command {
    constructor() {
        super(
            [ 
                'GuildSettings: Change the prefix for the current guild.',
                '>>', '!!', '?'
            ],
			{
                name: 'prefix',
                folder: 'Settings',
                args: [1, 1],
                ratelimit: 10,
                guildOnly: true
            }
        );
    }

    async init(message: Message<true>, { args }: Arguments) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.perms(
                message.channel,
                message.member,
                Permissions.FLAGS.ADMINISTRATOR
            );
        else if (args[0].length > 100)
            return this.Embed.error(`Maximum prefix length is 100 characters!`);

        const rows = await sql<kGuild[]>`
            UPDATE kbGuild
            SET prefix = ${args[0]}::text
            WHERE guild_id = ${message.guildId}::text
            RETURNING *;
        `;

        cache.set(message.guild.id, rows[0]);

        return this.Embed.ok(`Updated the guild's prefix to ${inlineCode(args[0])}`);
    }
}