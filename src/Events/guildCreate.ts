import { Event } from '../Structures/Event.js';
import { pool } from '../Structures/Database/Mongo.js';
import { pool as _pool } from '../Structures/Database/Postgres.js'; 
import { Guild } from 'discord.js';
import config from '../../config.json';
import { RegisterEvent } from '../Structures/Decorator.js';

@RegisterEvent
export class kEvent extends Event {
    name = 'guildCreate' as const;

    async init(guild: Guild) {
        const client = await pool.settings.connect();
        const collection = client.db('khafrabot').collection('settings');

        await collection.insertOne({
            id: guild.id,
            prefix: config.prefix,
            roleReacts: [],
            commandRole: [],
            disabledGuild: [],
            enabledGuild: [],
            welcomeChannel: guild.systemChannel,
            modActionLogChannel: null,
            rules: {
                channel: null,
                rules: [] 
            }
        });

        await _pool.query(`
            INSERT INTO kbGuild (
                guild_id, prefix, max_warning_points
            ) VALUES (
                $1::text, $2::text, $3::smallint
            ) ON CONFLICT DO NOTHING;
        `, [guild.id, config.prefix, 20]);
    }
}