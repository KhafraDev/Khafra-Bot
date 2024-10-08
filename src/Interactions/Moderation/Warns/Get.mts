import { sql } from '#khaf/database/Postgres.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import type { Warning } from '#khaf/types/KhafraBot.js'
import { maxDescriptionLength } from '#khaf/utility/constants.mjs'
import { plural } from '#khaf/utility/String.mjs'
import { bold, inlineCode, time } from '@discordjs/builders'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

interface Total {
  total_points: string
  dates: Warning['k_ts'][]
  ids: Warning['id'][]
  points: Warning['k_points'][]
}

type FromArray<T extends unknown[]> = T extends (infer U)[] ? U : never

type MappedWarning = [FromArray<Total['ids']>, FromArray<Total['dates']>, FromArray<Total['points']>]

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'warns',
    name: 'get'
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const member = interaction.options.getMember('member')
      ?? interaction.options.getUser('member', true)

    const id = 'id' in member ? member.id : null

    if (!id || !interaction.inGuild()) {
      return {
        content: '❌ To use this command, re-invite the bot with all permissions!',
        ephemeral: true
      }
    }

    const rows = await sql<[Total] | []>`
      SELECT 
        SUM(k_points) AS total_points,
        ARRAY_AGG(k_ts) dates,
        ARRAY_AGG(id) ids,
        ARRAY_AGG(k_points) points
      FROM kbWarns
      WHERE
        kbWarns.k_guild_id = ${interaction.guildId}::text AND
        kbWarns.k_user_id = ${id}::text
      LIMIT 1;
    `

    if (rows.length === 0 || !rows[0].dates.length || !rows[0].ids.length) {
      return {
        content: `✅ ${member} has no warning points!`,
        ephemeral: true
      }
    }

    const { dates, ids, points, total_points } = rows[0]
    const mapped = ids.map<MappedWarning>((id, idx) => [id, dates[idx], points[idx]])
    let content = `✅ ${member} has ${ids.length.toLocaleString()} warnings `
      + `with ${Number(total_points).toLocaleString()} warning points total.\n`

    // embeds can have a maximum of 25 fields
    for (const [id, date, p] of mapped) {
      const points = p.toLocaleString(interaction.guild?.preferredLocale ?? 'en-US')
      const line = `${bold(time(date))}: ${inlineCode(id)}: ${points} point${plural(p)}.\n`

      if (content.length + line.length > maxDescriptionLength) break

      content += line
    }

    return {
      content,
      ephemeral: true
    }
  }
}
