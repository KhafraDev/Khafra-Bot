import { sql } from '#khaf/database/Postgres.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { minutes } from '#khaf/utility/ms.js'
import type { APIEmbed } from 'discord-api-types/v10'
import {
  hyperlink,
  InteractionCollector,
  messageLink,
  time,
  userMention,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type StringSelectMenuInteraction
} from 'discord.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'

interface Report {
  t: 'report'
  reason: string | null
  type: null
  status: string
  targetAttachments: string[] | null
  contextAttachments: string | null
  contextUser: string
  messageId: string | null
  messageChannelId: string | null
  associatedTime: null
}

interface Case {
  t: 'case'
  reason: string | null
  type: string
  status: null
  targetAttachments: string[] | null
  contextAttachments: string | null
  contextUser: string
  messageId: null
  messageChannelId: null
  associatedTime: Date | null
}

const embedFromCase = (
  row: Report | Case | undefined,
  interaction: ChatInputCommandInteraction,
  total: number,
  page: number,
  cache: Map<number, APIEmbed>
): APIEmbed => {
  const embed = Embed.json({ color: colors.ok, description: '' })

  if (!row) {
    embed.description = 'Nothing to show here.'
    return embed
  } else if (cache.has(page - 1)) {
    return cache.get(page - 1)!
  }

  if (row.reason)
    embed.description += `📑 Reason: ${row.reason}\n`

  if (row.t === 'case') {
    embed.description += `👤 Handled by: ${userMention(row.contextUser)}\n`
    embed.description += `🗃️ Type: ${row.type}\n`

    if (row.associatedTime)
      embed.description += `⏰ Ends/Ended: ${time(row.associatedTime, 'R')} (${time(row.associatedTime, 'f')})\n`
  } else {
    embed.description += `👤 Reported by: ${userMention(row.contextUser)}\n`
    embed.description += `❗ Status: ${row.status}\n`

    if (row.messageId && interaction.guildId) {
      const link = messageLink(row.messageChannelId!, row.messageId, interaction.guildId)
      embed.description += `🔗 Message: ${hyperlink('here', link)}\n`
    }
  }

  if (row.targetAttachments?.length)
    embed.description += `🖼️ Attachments:\n${row.targetAttachments.join('\n')}`

  if (row.contextAttachments)
    embed.image = { url: row.contextAttachments }

  embed.footer = {
    text: `Case ${page}/${total}`
  }

  cache.set(page - 1, embed)

  return embed
}

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'case',
      name: 'view-user'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<void> {
    assert(interaction.inGuild())

    let page = 0
    let filter: (Report | Case)[] | undefined

    const id = randomUUID()
    const cache = new Map<number, APIEmbed>()
    const user = interaction.options.getUser('member', true)

    const allCases = await sql<(Report | Case)[]>`
      SELECT
        'report' AS t,
        reason,
        null as type,
        status,
        "targetAttachments",
        "contextAttachments",
        "reporterId" AS "contextUser",
        "messageId",
        "messageChannelId",
        null as "associatedTime"
      FROM "kbReport"
      WHERE
        "kbReport"."guildId" = ${interaction.guildId} AND
        "kbReport"."targetId" = ${user.id}

      UNION ALL

      SELECT
        'case' AS t,
        reason,
        type,
        null as status,
        "targetAttachments",
        "contextAttachments",
        "staffId" AS "contextUser",
        null as "messageId",
        null as "messageChannelId",
        "associatedTime"
      FROM "kbCases"
      WHERE
        "kbCases"."guildId" = ${interaction.guildId} AND
        "kbCases"."targetId" = ${user.id}
    `

    const { cases, report } = allCases.reduce((prev, curr) => {
      if (curr.t === 'case') {
        prev.cases.push(curr)
      } else {
        prev.report.push(curr)
      }

      return prev
    }, { cases: [] as Case[], report: [] as Report[] })

    const message = await interaction.editReply({
      embeds: [
        embedFromCase(allCases[page], interaction, allCases.length, page + 1, cache)
      ],
      components: [
        Components.actionRow([
          Buttons.primary('⏩', `fastforward-${id}`),
          Buttons.primary('▶️', `forward-${id}`),
          Buttons.primary('◀️', `backward-${id}`),
          Buttons.primary('⏪', `rewind-${id}`)
        ]),
        Components.actionRow([
          Components.selectMenu({
            custom_id: `select-${id}`,
            options: [
              { label: 'Cases', value: `selectactive-${id}` },
              { label: 'Reports', value: `selectinactive-${id}` },
              { label: 'All', value: `selectall-${id}` }
            ]
          })
        ])
      ]
    })

    const collector = new InteractionCollector<
      ButtonInteraction | StringSelectMenuInteraction
    >(interaction.client, {
      message,
      time: minutes(5),
      filter: (i) =>
        interaction.user.id === i.user.id &&
        i.customId.endsWith(id)
    })

    for await (const [i] of collector) {
      const [name] = i.customId.split('-', 1)

      if (i.isStringSelectMenu()) {
        const [name] = i.values[0].split('-', 1)
        page = 0

        if (name === 'selectactive' || name === 'selectinactive') {
          filter = name === 'selectactive' ? cases : report
        } else {
          assert(name === 'selectall')
          filter = undefined
        }
      } else {
        if (name === 'fastforward') {
          page = (filter ?? allCases).length - 1
        } else if (name === 'forward') {
          page++
        } else if (name === 'backward') {
          page--
        } else {
          assert(name === 'rewind')
          page = 0
        }

        if (page < 0) page = (filter ?? allCases).length - 1
        if (page >= (filter ?? allCases).length) page = 0
      }

      await i.update({
        embeds: [
          embedFromCase(
            (filter ?? allCases)[page],
            interaction,
            (filter ?? allCases).length,
            page + 1,
            cache
          )
        ]
      })
    }

    if (message.editable) {
      await message.edit({
        components: disableAll(message)
      })
    }
  }
}
