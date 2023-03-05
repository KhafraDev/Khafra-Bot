import { sql } from '#khaf/database/Postgres.mjs'
import type { Event } from '#khaf/Event'
import { loggerUtility } from '#khaf/structures/Logger.mjs'
import { Events, type Guild } from 'discord.js'

export class kEvent implements Event {
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
