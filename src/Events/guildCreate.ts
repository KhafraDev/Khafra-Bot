import { Event } from '../Structures/Event.js';
import { pool } from '../Structures/Database/Postgres.js'; 
import { Guild } from 'discord.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { createFileWatcher } from '../lib/Utility/FileWatcher.js';
import { cwd } from '../lib/Utility/Constants/Path.js';
import { join } from 'path';

const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'));

@RegisterEvent
export class kEvent extends Event<'guildCreate'> {
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