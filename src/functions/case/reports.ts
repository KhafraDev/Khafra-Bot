import { sql } from '#khaf/database/Postgres.js'
import { makeCase } from '#khaf/functions/case/makeCase.js'
import type { ButtonInteraction } from 'discord.js'
import assert from 'node:assert'

const reportv1 = /^report::(ban|kick|ignore|softban|mute)::(\d+)$/

export interface Report {
  id: number
  reason: string
  reporterId: string
  targetId: string
  targetAttachments?: string[] | null
  contextAttachments?: string | null
  messageId?: string | null
  messageChannelId?: string | null
  guildId: string
  status: string
}

export interface Case {
  case?: number
  type: 'ban' | 'kick' | 'softban' | 'unban' | 'mute'
  targetId: string
  targetAttachments?: string[] | null
  contextAttachments?: string | null
  reason: string
  staffId: string
  associatedTime?: Date | null
}

export const handleReport = async (interaction: ButtonInteraction<'raw' | 'cached'>): Promise<void> => {
  assert(interaction.customId.startsWith('report::'))
  await interaction.deferReply({ ephemeral: true })

  const { customId } = interaction
  const [, action, caseId] = reportv1.exec(customId)!

  const [report] = await sql<Report[]>`
    UPDATE "kbReport" SET
      status = ${action}::text
    WHERE
      id = ${caseId} AND "guildId" = ${interaction.guildId}
    RETURNING *
  `

  const user = await interaction.client.users.fetch(report.targetId)

  if (action === 'ignore') {
    const message =
      `The report was handled by ${interaction.user}, who decided that no action was to be taken against ${user}.`

    if (interaction.message.editable) {
      await interaction.message.edit({
        components: [],
        content: message
      })
    }

    return void await interaction.editReply({
      content: message
    })
  }

  await makeCase({ ...report, type: action as Case['type'], interaction })

  const message = `The report was handled by ${interaction.user}, action was taken against ${user} (a ${action}).`

  if (interaction.message.editable) {
    await interaction.message.edit({
      components: [],
      content: message
    })
  }

  await interaction.editReply({
    content: message
  })
}
