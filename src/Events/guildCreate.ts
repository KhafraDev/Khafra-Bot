import { sql } from '#khaf/database/Postgres.js'
import { Event } from '#khaf/Event'
import { loggerUtility } from '#khaf/structures/Logger.js'
import { Events, type Guild } from 'discord.js'

export class kEvent extends Event<typeof Events.GuildCreate> {
    name = Events.GuildCreate as const

    async init (guild: Guild): Promise<void> {
        loggerUtility.logGuild(guild, 'Joined a new guild!')

        await sql`
            INSERT INTO kbGuild (
                guild_id, max_warning_points
            ) VALUES (
                ${guild.id}::text, ${20}::smallint
            ) ON CONFLICT DO NOTHING;
        `

        await guild.roles.fetch()
    }
}