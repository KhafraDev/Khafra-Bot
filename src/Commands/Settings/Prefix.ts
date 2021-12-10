import { inlineCode } from '@khaf/builders';
import { Permissions, TextChannel } from 'discord.js';
import { Message } from '../../lib/types/Discord.js.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Arguments, Command } from '../../Structures/Command.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { client } from '../../Structures/Database/Redis.js';

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

    async init(message: Message, { args }: Arguments) {
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