import { sql } from '#khaf/database/Postgres.js'
import { Event } from '#khaf/Event'
import { logger } from '#khaf/structures/Logger/FileLogger.js'
import { dontThrow } from '#khaf/utility/Don\'tThrow.js'
import { Events, type Guild } from 'discord.js'

export class kEvent extends Event<typeof Events.GuildCreate> {
    name = Events.GuildCreate as const

    async init (guild: Guild): Promise<void> {
        logger.info({ guild }, 'Joined a new guild!')

        await sql`
            INSERT INTO kbGuild (
                guild_id, max_warning_points
            ) VALUES (
                ${guild.id}::text, ${20}::smallint
            ) ON CONFLICT DO NOTHING;
        `

        await dontThrow(guild.roles.fetch())
    }
}