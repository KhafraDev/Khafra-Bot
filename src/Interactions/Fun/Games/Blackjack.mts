import { InteractionSubCommand } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { templates } from '#khaf/utility/Constants/Path.mjs'
import { seconds } from '#khaf/utility/ms.mjs'
import { Transformer } from '@napi-rs/image'
import { InteractionType } from 'discord-api-types/v10'
import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
  InteractionReplyOptions,
  Snowflake
} from 'discord.js'
import { InteractionCollector } from 'discord.js'
import type { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'

type Card =
  | [value: number, suit: typeof suits[number]]
  | [value: 1 | 15, suit: typeof suits[number], playerAsked?: boolean]

interface Game {
  dealer: Card[]
  sucker: Card[]
}

const games = new Set<Snowflake>()
const suits = ['Hearts', 'Diamond', 'Clubs', 'Spades'] as const

const gameUtil = {
  getTotalCardValue (cards: Card[]) {
    return cards.reduce((a, [b, , picked]) => {
      if (b === 1 || b === 15) {
        if (!picked) {
          return a + 0
        }

        return a + Math.min(b, 11)
      } else if (b > 9) { // card is a suit
        // ace is the only card that has a value > 10
        return a + 10
      }

      return a + b
    }, 0)
  },
  deckFactory (): Card[] {
    const cards: Card[] = []

    for (let i = 1; i <= 13; i++) { // 1-13 (ace to king)
      for (let j = 0; j < 4; j++) { // suits
        cards.push([i, suits[j]])
      }
    }

    return cards.sort(() => 0.5 - Math.random())
  },
  mapCardsToFileNames (cards: Card[]): string[] {
    const names: string[] = []

    for (const [idx, suit] of cards) {
      names.push(templates('cards', `${suit} ${idx === 15 ? 1 : idx}.png`))
    }

    return names
  }
} as const

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'games',
    name: 'blackjack'
  }

  onEnd (interaction: Interaction) {
    games.delete(interaction.user.id)
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    if (games.has(interaction.user.id)) {
      return {
        content: '❌ Finish your other game before playing another!',
        ephemeral: true
      }
    }

    games.add(interaction.user.id)

    const id = randomUUID()
    const turnComponents = (disable = false) =>
      Components.actionRow([
        Buttons.approve('Hit', `hit-${id}`, { disabled: disable }),
        Buttons.secondary('Stay', `stay-${id}`, { disabled: disable })
      ])
    const pickAceComponents = (disable = false) =>
      Components.actionRow([
        Buttons.primary('1', `ace-1-${id}`, { disabled: disable }),
        Buttons.primary('11', `ace-15-${id}`, { disabled: disable })
      ])

    const deck = gameUtil.deckFactory()
    const score: Game = {
      dealer: deck.splice(0, 2),
      sucker: deck.splice(0, 2)
    }

    const makeOptions = async (disable = false, dealer = false): Promise<
      Pick<
        InteractionReplyOptions,
        'embeds' | 'files' | 'components'
      >
    > => {
      const image = await this.image(score, dealer)

      if (dealer) {
        for (const card of score.dealer) {
          if (card[0] === 1 || card[0] === 15) {
            card[2] = true
          }
        }
      }

      const dealerTotal = gameUtil.getTotalCardValue(score.dealer)
      const suckerTotal = gameUtil.getTotalCardValue(score.sucker)

      const pickAce = score.sucker.some(
        ([value, , picked]) => (value === 1 || value === 15) && !picked
      )

      let title: string | undefined

      if (dealerTotal > 21) {
        title = 'You win!'
      } else if (dealerTotal >= suckerTotal) {
        title = 'You lose!'
      }

      return {
        embeds: [
          Embed.json({
            color: colors.ok,
            image: { url: 'attachment://blackjack.png' },
            description: `Dealer: ${dealer ? dealerTotal : '??'} | Player: ${suckerTotal}`,
            title
          })
        ],
        files: [{
          attachment: image,
          name: 'blackjack.png'
        }],
        components: pickAce ? [pickAceComponents(disable)] : [turnComponents(disable)]
      }
    }

    const int = await interaction.editReply(await makeOptions())

    const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
      interactionType: InteractionType.MessageComponent,
      message: int,
      idle: seconds(30),
      filter: (i) =>
        interaction.user.id === i.user.id
        && int.id === i.message.id
        && i.customId.endsWith(id)
    })

    for await (const [i] of collector) {
      if (i.customId.startsWith('ace')) {
        const [, value] = i.customId.split('-')
        const cardIdx = score.sucker.findIndex(
          ([v, , picked]) => (v === 1 || v === 15) && !picked
        )

        score.sucker[cardIdx][0] = Number(value)
        score.sucker[cardIdx][2] = true

        await i.update(await makeOptions())
      } else if (i.customId.startsWith('hit')) {
        const [card, suit] = deck.shift()!

        score.sucker.push([card, suit])
        const total = gameUtil.getTotalCardValue(score.sucker)

        if (total > 21) { // player lost
          collector.stop()
          await i.update(await makeOptions(true, true))
        } else { // continue playing
          await i.update(await makeOptions())
        }
      } else {
        const totalPlayer = gameUtil.getTotalCardValue(score.sucker)

        while (gameUtil.getTotalCardValue(score.dealer) < totalPlayer) {
          const card = deck.shift()!

          if (card[0] === 1) {
            const total = gameUtil.getTotalCardValue(score.dealer)

            if (total + 11 <= 21) {
              card[0] = 15
            }

            card[2] = true // picked value
          }

          score.dealer.push(card)
        }

        collector.stop()
        await i.update(await makeOptions(true, true))
      }
    }

    if (collector.endReason === 'idle') {
      await interaction.editReply({
        components: disableAll(int)
      })
    }
  }

  async image ({ dealer, sucker }: Game, isDealer: boolean): Promise<Buffer> {
    // each card is 103px wide, 138px tall
    const cardWidth = 105
    const height = 300
    const width = Math.max(dealer.length, sucker.length) * cardWidth

    const transformer = Transformer.fromRgbaPixels(
      new Uint8Array(width * height * 4),
      width,
      height
    )

    const dealerFilePaths = gameUtil.mapCardsToFileNames(dealer)
    const suckerFilePaths = gameUtil.mapCardsToFileNames(sucker)

    if (!isDealer) {
      dealerFilePaths[0] = templates('cards', 'Back Red 1.png')
    }

    for (let i = 0; i < dealer.length; i++) {
      transformer.overlay(await readFile(dealerFilePaths[i]), cardWidth * i, 0)
    }

    for (let j = 0; j < sucker.length; j++) {
      transformer.overlay(await readFile(suckerFilePaths[j]), cardWidth * j, height - 138)
    }

    return await transformer.png()
  }
}
