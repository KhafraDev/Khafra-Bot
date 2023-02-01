import { sql } from '#khaf/database/Postgres.js'
import type { Case, Report } from '#khaf/functions/case/reports.js'
import type { ButtonInteraction } from 'discord.js'
import assert from 'node:assert'

type CreateCase = Omit<Report, 'id'> & {
  type: Case['type']
  interaction: ButtonInteraction<'raw' | 'cached'>
}

export const makeCase = async (report: CreateCase): Promise<void> => {
  const { type, interaction, ...rest } = report

  const guild = interaction.guild ?? await interaction.client.guilds.fetch(report.guildId)

  switch (type) {
    case 'ban': {
      await guild.members.ban(rest.targetId, { reason: rest.reason })
      break
    }
    case 'kick': {
      await guild.members.kick(rest.targetId, rest.reason)
      break
    }
    case 'softban': {
      await guild.members.ban(rest.targetId, { reason: rest.reason })
      await guild.members.unban(rest.targetId, rest.reason)
      break
    }
    default:
      assert(false, 'unreachable')
  }

  const _case = {
    type,
    targetId: rest.targetId,
    targetAttachments: rest.targetAttachments,
    contextAttachments: rest.contextAttachments,
    reason: rest.reason,
    staffId: interaction.user.id,
    guildId: guild.id
  } satisfies Case

  await sql`
    INSERT INTO "kbCases"
    ${sql(_case as Record<string, unknown>, ...Object.keys(_case))}
  `
}
