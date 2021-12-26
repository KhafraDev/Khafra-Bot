import { Event } from '#khaf/Event';
import { pool } from '#khaf/database/Postgres.js';
import { Guild } from 'discord.js';

export class kEvent extends Event<'guildDelete'> {
    name = 'guildDelete' as const;

    async init(guild: Guild) {
        await pool.query(`
            DELETE FROM kbGuild
            WHERE guild_id = $1::text;
        `, [guild.id]);

        await pool.query(`
            DELETE FROM kbWarns
            WHERE k_guild_id = $1::text;
        `, [guild.id]);
    }
}