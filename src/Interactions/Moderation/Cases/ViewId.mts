import { sql } from '#khaf/database/Postgres.mjs'
import type { Case } from '#khaf/functions/case/reports.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { type ChatInputCommandInteraction, type InteractionReplyOptions, time, userMention } from 'discord.js'
import assert from 'node:assert'

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'case',
    name: 'view-id'
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    assert(interaction.inGuild())

    const id = interaction.options.getInteger('id', true)

    const [row] = await sql<[Case?]>`
      SELECT * FROM "kbCases"
      WHERE
        "kbCases"."guildId" = ${interaction.guildId} AND
        "kbCases".case = ${id}
      LIMIT 1
    `

    if (!row) {
      return {
        embeds: [
          Embed.json({
            color: colors.error,
            description: 'No case was found.'
          })
        ]
      }
    }

    const embed = Embed.json({ color: colors.ok, description: '' })

    if (row.staffReason) {
      embed.description += `📑 Reason: ${row.staffReason}\n`
    }

    embed.description += `👤 Handled by: ${userMention(row.staffId)}\n`
    embed.description += `🗃️ Type: ${row.type}\n`

    if (row.associatedTime) {
      embed.description += `⏰ Ends/Ended: ${time(row.associatedTime, 'R')} (${time(row.associatedTime, 'f')})\n`
    }

    if (row.targetAttachments?.length) {
      embed.description += `🖼️ Attachments:\n${row.targetAttachments.join('\n')}`
    }

    if (row.contextAttachments) {
      embed.image = { url: row.contextAttachments }
    }

    return {
      embeds: [embed]
    }
  }
}
