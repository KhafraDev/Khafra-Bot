import { inlineCode } from '@khaf/builders';
import { Permissions, TextChannel, Message } from 'discord.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Arguments, Command } from '#khaf/Command';
import { pool } from '#khaf/database/Postgres.js';
import { client } from '#khaf/database/Redis.js';

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
                message.channel as TextChannel,
                message.member,
                Permissions.FLAGS.ADMINISTRATOR
            );
        else if (args[0].length > 100)
            return this.Embed.error(`Maximum prefix length is 100 characters!`);

        const { rows } = await pool.query<kGuild>(`
            UPDATE kbGuild
            SET prefix = $1::text
            WHERE guild_id = $2::text
            RETURNING *;
        `, [args[0]!, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({ ...rows[0] }), 'EX', 600);

        return this.Embed.ok(`Updated the guild's prefix to ${inlineCode(args[0])}`);
    }
}