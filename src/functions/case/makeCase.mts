import { sql } from '#khaf/database/Postgres.mjs'
import type { Case, Report } from '#khaf/functions/case/reports.mjs'
import type { ButtonInteraction } from 'discord.js'
import assert from 'node:assert'

type CreateCase = Omit<Report, 'id'> & {
  type: Case['type']
  interaction: ButtonInteraction<'raw' | 'cached'>
}

export const makeCase = async (report: CreateCase): Promise<void> => {
  const { type, interaction, ...rest } = report

  const guild = interaction.guild ?? await interaction.client.guilds.fetch(report.guildId)

  // TODO: allow for staff to add reasons
  switch (type) {
    case 'ban': {
      await guild.members.ban(rest.targetId)
      break
    }
    case 'kick': {
      await guild.members.kick(rest.targetId)
      break
    }
    case 'softban': {
      await guild.members.ban(rest.targetId)
      await guild.members.unban(rest.targetId)
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
    userReason: rest.reason,
    staffReason: null,
    staffId: interaction.user.id,
    guildId: guild.id,
    associatedTime: null
  } satisfies Case

  await sql`
    INSERT INTO "kbCases"
    ${sql(_case as Record<string, unknown>, ...Object.keys(_case))}
  `
}
