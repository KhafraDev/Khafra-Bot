import { randomUUID } from 'node:crypto'
import { codeBlock } from '@discordjs/builders'
import type { APIEmbed, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { InteractionType } from 'discord-api-types/v10'
import type { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js'
import { InteractionCollector } from 'discord.js'
import { Interactions } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { evaluatePostfix, infixToPostfix } from '#khaf/utility/ShuntingYard.mjs'
import { seconds } from '#khaf/utility/ms.mjs'

const squiggles =
  '\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~' +
  '\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~\\~'

const isNumber = (char: string): boolean => {
  const code = char.charCodeAt(0)
  return code >= 48 && code <= 57
}

export class kInteraction extends Interactions {
  constructor() {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'calculator',
      description: 'Calculator in Discord!'
    }

    super(sc)
  }

  async init(interaction: ChatInputCommandInteraction): Promise<void> {
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
      idle: seconds(30),
      filter: (i) =>
        i.isButton() &&
        interaction.user.id === i.user.id &&
        int.id === i.message.interaction?.id &&
        i.customId.endsWith(id)
    })

    const equation: string[] = []

    for await (const [i] of collector) {
      const token = i.customId.startsWith('-') ? '-' : i.customId.split('-')[0]

      if (token === '=') {
        collector.stop('calculate')
        break
      } else {
        if (token === 'clear') {
          equation.length = 0
        } else if (isNumber(token)) {
          if (equation.length === 0) {
            equation.push(token)
          } else if (isNumber(equation[equation.length - 1])) {
            equation[equation.length - 1] += token
          } else {
            equation.push(token)
          }
        } else {
          equation.push(token)
        }

        await i.update({
          embeds: [makeEmbed(equation.join(' '))]
        })
      }
    }

    if (collector.collected.size !== 0) {
      const i = collector.collected.last()!

      if (i.replied) return

      if (collector.endReason === 'calculate') {
        const postfix = infixToPostfix(equation.join(' '))
        const value = evaluatePostfix(postfix)

        if (Number.isNaN(value)) {
          await i.update({
            embeds: [makeEmbed('Invalid input!')],
            components: disableAll({ components: rows })
          })
        } else {
          await i.update({
            embeds: [makeEmbed(`${equation.join(' ')} = ${value}`)],
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
