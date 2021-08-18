import { Event } from '../Structures/Event.js';
import { pool } from '../Structures/Database/Postgres.js';
import { Guild } from 'discord.js';
import { RegisterEvent } from '../Structures/Decorator.js';

@RegisterEvent
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