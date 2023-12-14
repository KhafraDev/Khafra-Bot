import { Events, type Guild } from 'discord.js'
import type { Event } from '#khaf/Event'
import { sql } from '#khaf/database/Postgres.mjs'
import { loggerUtility } from '#khaf/structures/Logger.mjs'

export class kEvent implements Event {
  name = Events.GuildDelete as const

  async init(guild: Guild): Promise<void> {
    if (!guild.available) return

    await sql`
      DELETE FROM kbGuild
      WHERE guild_id = ${guild.id}::text;
    `

    await sql`
      DELETE FROM kbWarns
      WHERE k_guild_id = ${guild.id}::text;
    `

    loggerUtility.logGuild(guild, 'left guild')
  }
}
