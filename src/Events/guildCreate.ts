import { sql } from '#khaf/database/Postgres.js';
import { Event } from '#khaf/Event';
import { logger } from '#khaf/Logger';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Events, type Guild } from 'discord.js';

export class kEvent extends Event<typeof Events.GuildCreate> {
    name = Events.GuildCreate;

    async init (guild: Guild): Promise<void> {
        logger.info('Joined a new guild!', {
            id: guild.id,
            name: guild.name
        });

        await sql`
            INSERT INTO kbGuild (
                guild_id, max_warning_points
            ) VALUES (
                ${guild.id}::text, ${20}::smallint
            ) ON CONFLICT DO NOTHING;
        `;

        await dontThrow(guild.roles.fetch());
    }
}