import { Event } from '../Structures/Event.js';
import { pool } from '../Structures/Database/Postgres.js'; 
import { Guild } from 'discord.js';
import config from '../../config.json';
import { RegisterEvent } from '../Structures/Decorator.js';

@RegisterEvent
export class kEvent extends Event {
    name = 'guildCreate' as const;

    async init(guild: Guild) {
        await pool.query(`
            INSERT INTO kbGuild (
                guild_id, prefix, max_warning_points
            ) VALUES (
                $1::text, $2::text, $3::smallint
            ) ON CONFLICT DO NOTHING;
        `, [guild.id, config.prefix, 20]);
    }
}