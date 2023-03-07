import { sql } from '#khaf/database/Postgres.mjs'
import { InteractionSubCommand } from '#khaf/Interaction'
import type { Giveaway } from '#khaf/types/KhafraBot.js'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { isGuildTextBased } from '#khaf/utility/Discord.js'
import { minutes } from '#khaf/utility/ms.mjs'
import { stripIndents } from '#khaf/utility/Template.mjs'
import { time } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import {
  channelMention,
  InteractionCollector,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type StringSelectMenuInteraction
} from 'discord.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'

type GiveawayRow = Pick<Giveaway, 'id' | 'enddate' | 'prize' | 'winners' | 'didEnd' | 'channelid' | 'messageid'>

const embedFromGiveaway = async (
  row: GiveawayRow | undefined,
  interaction: ChatInputCommandInteraction<'cached' | 'raw'>,
  total: number,
  page: number,
  cache: Map<number, APIEmbed>
): Promise<APIEmbed> => {
  const embed = Embed.json({ color: colors.ok })

  if (!row) {
    embed.description = 'Nothing to show here.'
    return embed
  } else if (cache.has(page - 1)) {
    return cache.get(page - 1)!
  }

  const guild = await interaction.client.guilds.fetch(interaction.guildId)
  const channel = await guild.channels.fetch(row.channelid)
  assert(isGuildTextBased(channel))
  const { reactions } = await channel.messages.fetch(row.messageid)
  const entries = reactions.cache.get('🎉')?.count.toLocaleString(interaction.locale)

  embed.description = stripIndents`
  📑 Description: ${row.prize}
  👤 Hosted by: ${interaction.user}
  🏟️ Hosted in: ${channelMention(row.channelid)}
  👥 Total entries: ${entries ?? 'unknown'}
  👑 Total winners: ${row.winners}
  ❗ Status: ${row.didEnd ? 'Inactive' : 'Active'}
  ⏰ Ends in: ${time(row.enddate, 'R')} (${time(row.enddate, 'f')})
  `

  embed.footer = {
    text: `Giveaway ${page}/${total} • Giveaway id ${row.id}`
  }

  cache.set(page - 1, embed)

  return embed
}

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'giveaway',
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
    let filter: GiveawayRow[] | undefined
    const id = randomUUID()
    const cache = new Map<number, APIEmbed>()

    const giveaways = await sql<GiveawayRow[]>`
      SELECT id, enddate, prize, winners, "didEnd", channelid, messageid FROM kbGiveaways
      WHERE
        kbGiveaways.guildid = ${interaction.guildId}::text AND
        kbGiveaways.initiator = ${interaction.user.id}::text
      ORDER BY enddate ASC
      LIMIT 50
    `

    const { active, inactive } = giveaways.reduce((prev, curr) => {
      if (curr.didEnd) {
        prev.inactive.push(curr)
      } else {
        prev.active.push(curr)
      }

      return prev
    }, { active: [] as GiveawayRow[], inactive: [] as GiveawayRow[] })

    const message = await interaction.editReply({
      embeds: [
        await embedFromGiveaway(giveaways[page], interaction, giveaways.length, page + 1, cache)
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
              { label: 'Active giveaways', value: `selectactive-${id}` },
              { label: 'Inactive giveaways', value: `selectinactive-${id}` },
              { label: 'All giveaways', value: `selectall-${id}` }
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
          page = (filter ?? giveaways).length - 1
        } else if (name === 'forward') {
          page++
        } else if (name === 'backward') {
          page--
        } else {
          assert(name === 'rewind')
          page = 0
        }

        if (page < 0) page = (filter ?? giveaways).length - 1
        if (page >= (filter ?? giveaways).length) page = 0
      }

      await i.update({
        embeds: [
          await embedFromGiveaway(
            (filter ?? giveaways)[page],
            interaction,
            (filter ?? giveaways).length,
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
