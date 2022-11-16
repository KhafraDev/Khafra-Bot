import { InteractionSubCommand } from '#khaf/Interaction'
import { shuffle } from '#khaf/utility/Array.js'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { templates } from '#khaf/utility/Constants/Path.js'
import { createCanvas, Image } from '@napi-rs/canvas'
import { InteractionType } from 'discord-api-types/v10'
import type { ButtonInteraction, ChatInputCommandInteraction, InteractionReplyOptions, Snowflake } from 'discord.js'
import { InteractionCollector } from 'discord.js'
import { randomUUID } from 'node:crypto'
import type { Buffer } from 'node:buffer'
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
    return cards.reduce((a, [b,, picked]) => {
      if (b > 9) { // card is a suit
        // ace is the only card that has a value > 10
        return a + (b === 15 ? 11 : 10)
      } else if (b === 1 && !picked) {
        return a + 0
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

    return shuffle(cards)
  },
  mapCardsToFileNames (cards: Card[]): string[] {
    const names: string[] = []

    for (const [idx, suit] of cards) {
      names.push(templates('cards', `${suit} ${idx === 15 ? 1 : idx}.png`))
    }

    return names
  }
} as const

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'games',
      name: 'blackjack'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    if (games.has(interaction.user.id)) {
      return {
        content: '❌ Finish your other game before playing another!',
        ephemeral: true
      }
    }

    const id = randomUUID()
    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    const turnComponents = (disable = false) => Components.actionRow([
      Buttons.approve('Hit', `hit-${id}`, { disabled: disable }),
      Buttons.secondary('Stay', `stay-${id}`, { disabled: disable })
    ])
    const pickAceComponents = (disable = false) => Components.actionRow([
      Buttons.primary('1', `ace-1-${id}`, { disabled: disable }),
      Buttons.primary('11', `ace-15-${id}`, { disabled: disable })
    ])
    /* eslint-enable @typescript-eslint/explicit-function-return-type */

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

      const dealerTotal = dealer ? gameUtil.getTotalCardValue(score.dealer) : '??'
      const suckerTotal = gameUtil.getTotalCardValue(score.sucker)

      const pickAce = score.sucker.some(
        ([value, , picked]) => (value === 1 || value === 15) && !picked
      )

      return {
        embeds: [
          Embed.json({
            color: colors.ok,
            image: { url: 'attachment://blackjack.png' },
            description: `Dealer: ${dealerTotal} | Player: ${suckerTotal}`
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
      idle: 30_000,
      filter: (i) =>
        interaction.user.id === i.user.id &&
        int.id === i.message.id &&
        i.customId.endsWith(id)
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
              card[2] = true
            }
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
    const canvas = createCanvas(Math.max(dealer.length, sucker.length) * 105, 300)
    const ctx = canvas.getContext('2d')

    const dealerFilePaths = gameUtil.mapCardsToFileNames(dealer)
    const suckerFilePaths = gameUtil.mapCardsToFileNames(sucker)

    if (!isDealer) {
      dealerFilePaths[0] = templates('cards', 'Back Red 1.png')
    }

    for (let i = 0; i < dealer.length; i++) {
      const image = new Image()
      image.src = await readFile(dealerFilePaths[i])

      ctx.drawImage(image, 105 * i, 0)
    }

    for (let j = 0; j < sucker.length; j++) {
      const image = new Image()
      image.src = await readFile(suckerFilePaths[j])

      ctx.drawImage(image, 105 * j, 300 - 138)
    }

    return canvas.toBuffer('image/png')
  }
}
