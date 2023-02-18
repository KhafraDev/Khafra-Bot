import { sql } from '#khaf/database/Postgres.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import type { kReminder } from '#khaf/types/KhafraBot'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { minutes } from '#khaf/utility/ms.js'
import { stripIndents } from '#khaf/utility/Template.js'
import { time } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import {
  InteractionCollector,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type StringSelectMenuInteraction
} from 'discord.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'

const embedFromGiveaway = (
  row: kReminder | undefined,
  interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
  total: number,
  page: number
): APIEmbed => {
  const embed = Embed.json({ color: colors.ok })

  if (!row) {
    embed.description = 'Nothing to show here.'
    return embed
  }

  const endVerb = row.time.getTime() <= Date.now()
    ? 'Ended'
    : 'Ends in'

  embed.description = stripIndents`
  📑 Description: ${row.message}
  👤 Reminding: ${interaction.user}
  ❗ Repeats: ${row.once ? 'no' : 'yes'}
  ⏱️ Interval: ${row.interval}
  ⏰ ${endVerb}: ${time(row.time, 'R')} (${time(row.time, 'f')})
  `

  embed.footer = {
    text: `Reminder ${page}/${total} • Reminder id ${row.id}`
  }

  return embed
}

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'reminders',
      name: 'view'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    if (!interaction.inGuild()) {
      return {
        content: '❌ Unable to use the command.',
        ephemeral: true
      }
    }

    let page = 0
    let filter: kReminder[] | undefined
    const id = randomUUID()

    const reminders = await sql<kReminder[]>`
      SELECT * FROM "kbReminders"
      WHERE
        "kbReminders"."userId" = ${interaction.user.id}::text
      ORDER BY "time" ASC
      LIMIT 50
    `

    const { active, inactive } = reminders.reduce((prev, curr) => {
      if (curr.didEnd) {
        prev.inactive.push(curr)
      } else {
        prev.active.push(curr)
      }

      return prev
    }, { active: [] as kReminder[], inactive: [] as kReminder[] })

    const message = await interaction.editReply({
      embeds: [
        embedFromGiveaway(reminders[page], interaction, reminders.length, page + 1)
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
              { label: 'Active reminders', value: `selectactive-${id}` },
              { label: 'Inactive reminders', value: `selectinactive-${id}` },
              { label: 'All reminders', value: `selectall-${id}` }
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
          filter = name === 'selectactive' ? active : inactive
        } else {
          assert(name === 'selectall')
          filter = undefined
        }
      } else {
        if (name === 'fastforward') {
          page = (filter ?? reminders).length - 1
        } else if (name === 'forward') {
          page++
        } else if (name === 'backward') {
          page--
        } else {
          assert(name === 'rewind')
          page = 0
        }

        if (page < 0) page = (filter ?? reminders).length - 1
        if (page >= (filter ?? reminders).length) page = 0
      }

      await i.update({
        embeds: [
          embedFromGiveaway(
            (filter ?? reminders)[page],
            interaction,
            (filter ?? reminders).length,
            page + 1
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