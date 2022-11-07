import { sql } from '#khaf/database/Postgres.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import type { Giveaway } from '#khaf/types/KhafraBot'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { plural } from '#khaf/utility/String.js'
import { stripIndents } from '#khaf/utility/Template.js'
import { inlineCode, time } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import { InteractionType } from 'discord-api-types/v10'
import type { ButtonInteraction, ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { InteractionCollector } from 'discord.js'
import { randomUUID } from 'node:crypto'
import type { PendingQuery, Row } from 'postgres'

type GiveawayRow = Pick<Giveaway, 'id' | 'enddate' | 'prize' | 'winners' | 'didEnd'>

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'giveaway',
      name: 'view'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
    if (interaction.guild === null) {
      return {
        content: '❌ Unable to use the command.',
        ephemeral: true
      }
    }

    const active = interaction.options.getBoolean('active')
    const ended = interaction.options.getBoolean('ended')

    let partialQuery: PendingQuery<Row[]>
    let contentNoGiveaways: string

    if (active) {
      partialQuery = sql`WHERE kbGiveaways."didEnd" = FALSE AND`
      contentNoGiveaways = '❌ You do not have any active giveaways!'
    } else if (ended) {
      partialQuery = sql`WHERE kbGiveaways."didEnd" = TRUE AND`
      contentNoGiveaways = '❌ You do not have any giveaways that have ended!'
    } else {
      // No options chosen/all
      partialQuery = sql`WHERE`
      contentNoGiveaways = '❌ You do not have any giveaways.'
    }

    const giveaways = await sql<GiveawayRow[]>`
			SELECT id, enddate, prize, winners, "didEnd" FROM kbGiveaways
			${partialQuery}
				kbGiveaways.guildid = ${interaction.guild.id}::text AND
				kbGiveaways.initiator = ${interaction.user.id}::text
			LIMIT 10
		`

    if (giveaways.length === 0) {
      return {
        content: contentNoGiveaways,
        ephemeral: true
      }
    }

    const baseEmbed = (): APIEmbed => Embed.json({
      color: colors.ok,
      author: {
        name: interaction.user.username,
        icon_url: interaction.user.displayAvatarURL()
      },
      description: ''
    })

    let page = 0
    const embeds: APIEmbed[] = [baseEmbed()]

    for (const { id, enddate, prize, winners, didEnd } of giveaways) {
      const description = stripIndents`
				${didEnd ? 'Inactive' : 'Active'} ${inlineCode(id)} (ends ${time(enddate, 'F')}, ${winners} winner${plural(winners)})
				${inlineCode(prize)}
			`

      const lastEmbed = embeds[embeds.length - 1]

      if (lastEmbed.description!.length + description.length + '\n\n'.length > 2048) {
        const embed = baseEmbed()
        embed.description = description
        embeds.push(baseEmbed())
      } else {
        lastEmbed.description += `\n\n${description}`
      }
    }

    const id = randomUUID()
    const reply = await interaction.editReply({
      embeds: [embeds[0]],
      content: `📖 Embed ${page}/${embeds.length}`,
      components: embeds.length === 1 ? undefined : [
        Components.actionRow([
          Buttons.approve('Next', `next-${id}`),
          Buttons.primary('Back', `back-${id}`),
          Buttons.deny('Stop', `stop-${id}`)
        ])
      ]
    })

    const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      message: reply,
      time: 45_000,
      max: embeds.length,
      filter: (i) =>
        interaction.user.id === i.user.id &&
        reply.id === i.message.id &&
        i.customId.endsWith(id)
    })

    for await (const [i] of collector) {
      const [name] = i.customId.split(`-${id}`, 1)

      if (name === 'stop') {
        collector.stop('by-user')
        await i.update({
          components: disableAll(reply)
        })
        break
      }

      name === 'next' ? page++ : page--

      if (page < 0) page = embeds.length - 1
      if (page >= embeds.length) page = 0

      await i.update({
        embeds: [embeds[page]],
        content: `📖 Embed ${page}/${embeds.length}`
      })
    }

    if (collector.endReason !== 'by-user') {
      await interaction.editReply({
        components: disableAll(reply)
      })
    }
  }
}
