import { sql } from '#khaf/database/Postgres.mjs'
import { makeCase } from '#khaf/functions/case/makeCase.mjs'
import { RESTJSONErrorCodes } from 'discord-api-types/v10'
import { DiscordAPIError, type ButtonInteraction } from 'discord.js'
import assert from 'node:assert'

const reportv1 = /^report::(ban|kick|ignore|softban|mute)::(\d+)$/

export interface Report {
  id?: number
  reason: string
  reporterId: string
  targetId: string
  targetAttachments: string[] | null
  contextAttachments: string | null
  messageId: string | null
  messageChannelId: string | null
  guildId: string
  status: string
}

export interface Case {
  case?: number
  type: 'ban' | 'kick' | 'softban' | 'unban' | 'mute' | 'unmute'
  targetId: string
  targetAttachments: string[] | null
  contextAttachments: string | null
  staffReason: string | null
  userReason: string | null
  staffId: string
  associatedTime: Date | null
  guildId: string
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

  let message: string

  try {
    await makeCase({ ...report, type: action as Case['type'], interaction })

    message = `The report was handled by ${interaction.user}, action was taken against ${user} (a ${action}).`
  } catch (e) {
    assert(e instanceof DiscordAPIError)

    if (e.code === RESTJSONErrorCodes.MissingPermissions) {
      message = `${interaction.user} I don't have permission to ${action} ${user}, sorry.`
    } else {
      message = `${interaction.user} An error occurred attempting to ${action} ${user} (${e.code}).`
    }
  }

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
