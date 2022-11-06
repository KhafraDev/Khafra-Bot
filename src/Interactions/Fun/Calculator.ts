import { Interactions } from '#khaf/Interaction'
import { logger } from '#khaf/structures/Logger.js'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { codeBlock } from '@discordjs/builders'
import type { APIEmbed, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { InteractionType } from 'discord-api-types/v10'
import type { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js'
import { InteractionCollector } from 'discord.js'
import { randomUUID } from 'node:crypto'
import { evaluate } from '@khaf/shunting-yard'

const squiggles =
    '\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~' +
    '\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'calculator',
      description: 'Calculator in Discord!'
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<void> {
    const id = randomUUID()
    const rows = [
      Components.actionRow([
        Buttons.approve('(', `(-${id}`),
        Buttons.approve(')', `)-${id}`),
        Buttons.approve('.', `.-${id}`),
        Buttons.deny('CE', `clear-${id}`)
      ]),
      Components.actionRow([
        Buttons.secondary('1', `1-${id}`),
        Buttons.secondary('2', `2-${id}`),
        Buttons.secondary('3', `3-${id}`),
        Buttons.approve('+', `+-${id}`)
      ]),
      Components.actionRow([
        Buttons.secondary('4', `4-${id}`),
        Buttons.secondary('5', `5-${id}`),
        Buttons.secondary('6', `6-${id}`),
        Buttons.approve('-', `--${id}`)
      ]),
      Components.actionRow([
        Buttons.secondary('7', `7-${id}`),
        Buttons.secondary('8', `8-${id}`),
        Buttons.secondary('9', `9-${id}`),
        Buttons.approve('*', `*-${id}`)
      ]),
      Components.actionRow([
        Buttons.deny('Stop', `stop-${id}`),
        Buttons.secondary('0', `0-${id}`),
        Buttons.deny('=', `=-${id}`),
        Buttons.approve('/', `/-${id}`)
      ])
    ]

    const makeEmbed = (m: string): APIEmbed =>
      Embed.ok(`
      ${squiggles}
      ${codeBlock(m)}
      ${squiggles}
      `)

    const int = await interaction.reply({
      embeds: [makeEmbed('Empty')],
      components: rows
    })

    const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      idle: 30_000,
      filter: (i) =>
        interaction.user.id === i.user.id &&
        int.id === i.message.interaction?.id &&
        i.customId.endsWith(id)
    })

    let equation = ''

    for await (const [i] of collector) {
      const token = i.customId[0] === '-' ? '-' : i.customId.split('-')[0]

      if (token === '=') {
        collector.stop('calculate')
        break
      } else {
        if (token === 'clear') {
          equation = ''
        } else {
          equation += token
        }

        await i.update({
          embeds: [makeEmbed(equation)]
        })
      }
    }

    if (collector.collected.size !== 0) {
      const i = collector.collected.last()!

      if (i.replied) return

      if (collector.endReason === 'calculate') {
        let eq: number | 'Invalid input!' = 'Invalid input!'

        try {
          eq = evaluate(equation)
        } catch (e) {
          logger.error(e, 'calculator parsing error')
        }

        if (eq === 'Invalid input!') {
          await i.update({
            embeds: [makeEmbed(eq)],
            components: disableAll({ components: rows })
          })
        } else {
          await i.update({
            embeds: [makeEmbed(`${equation} = ${eq}`)],
            components: disableAll({ components: rows })
          })
        }
      }
    } else {
      await interaction.editReply({
        components: disableAll({ components: rows })
      })
    }
  }
}
