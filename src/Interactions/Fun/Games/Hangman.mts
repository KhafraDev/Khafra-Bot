import { InteractionSubCommand } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { assets } from '#khaf/utility/Constants/Path.mjs'
import { seconds } from '#khaf/utility/ms.mjs'
import { plural } from '#khaf/utility/String.mjs'
import { stripIndents } from '#khaf/utility/Template.mjs'
import { inlineCode } from '@discordjs/builders'
import { type Snowflake, TextInputStyle } from 'discord-api-types/v10'
import { ComponentType, Interaction } from 'discord.js'
import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  InteractionCollector,
  type InteractionReplyOptions,
  type ModalSubmitInteraction,
  type WebhookMessageEditOptions
} from 'discord.js'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const assetsPath = assets('Hangman')
const cachedLists = new Map<string, string[]>()
const currentGames = new Set<Snowflake>()
const images = [
  'https://i.imgur.com/OmbNNhr.png', // nothing
  'https://i.imgur.com/W9gleFt.png', // head
  'https://i.imgur.com/0MMktbo.png', // body
  'https://i.imgur.com/Y3qL8m3.png', // left arm
  'https://i.imgur.com/2VrZF8h.png', // right arm
  'https://i.imgur.com/dOwLtrD.png', // left leg
  'https://i.imgur.com/yM0HnGz.png' // right leg
]

class Hangman {
  #guessed: string[] = []
  #word: string
  #wrong = 0
  #id: string

  #usedHint = false
  lastGuessWasWrong = false

  constructor (word: string, id: string) {
    this.#word = word.toLowerCase()
    this.#id = id
  }

  /**
   * Guess a given phrase or word
   * @returns true if the guess was added, false otherwise
   */
  guess (phraseOrChar: string): boolean {
    const guess = phraseOrChar.toLowerCase()

    if (this.#guessed.includes(guess)) {
      return false
    } else {
      if (
        (guess.length === 1 && !this.#word.includes(guess))
        || (guess.length > 1 && guess !== this.#word)
      ) {
        this.lastGuessWasWrong = true
        ;++this.#wrong
      } else {
        this.lastGuessWasWrong = false
      }

      this.#guessed.push(guess)
      return true
    }
  }

  /**
   * Replaces characters not guessed with a box.
   */
  hide (): string {
    let str = ''

    if (this.#guessed.includes(this.#word)) {
      return this.#word
    }

    for (const char of this.#word) {
      if (this.#guessed.includes(char) || char === ' ') {
        str += char
      } else {
        str += '☐'
      }
    }

    return str
  }

  toJSON (title = 'Hangman'): WebhookMessageEditOptions {
    return {
      content: undefined,
      embeds: [
        Embed.json({
          color: colors.ok,
          description: `
            ${this.hide()}
            ${this.#wrong} wrong guess${plural(this.#wrong, 'es')}.
            Guessed: ${this.#guessed.map((l) => inlineCode(l)).join(', ').slice(0, 250)}`,
          image: { url: images[this.#wrong] },
          title
        })
      ],
      components: [
        Components.actionRow([
          Buttons.approve('Guess', `showModal-${this.#id}`),
          Buttons.primary('Hint', `hint-${this.#id}`, {
            disabled: this.#usedHint,
            emoji: { name: '❓' }
          }),
          Buttons.deny('Quit', `quit-${this.#id}`)
        ])
      ]
    }
  }

  hint (): string | null {
    if (!this.canUseHint) return null

    while (!this.guess(this.#word[Math.floor(Math.random() * this.#word.length)]));

    this.#usedHint = true
    this.#wrong++

    return this.#guessed[this.#guessed.length - 1]
  }

  get canUseHint (): boolean {
    return this.#wrong + 1 < 6 && !this.#usedHint
  }

  get lost (): boolean {
    return this.#wrong >= 6
  }

  get winner (): boolean {
    const lessThan6Wrong = this.#wrong < 6
    const guessedEntireWord = this.#guessed.includes(this.#word)
    const gussedEveryChar = [...this.#word].every(
      (c) => c === ' ' || this.#guessed.includes(c.toLowerCase())
    )

    return lessThan6Wrong && (guessedEntireWord || gussedEveryChar)
  }
}

export class kSubCommand implements InteractionSubCommand {
  data = {
    references: 'games',
    name: 'hangman'
  }

  onEnd (interaction: Interaction) {
    currentGames.delete(interaction.user.id)
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
    if (currentGames.has(interaction.user.id)) {
      return {
        content: '❌ Finish your current game first!',
        ephemeral: true
      }
    }

    const listName = interaction.options.getString('lists') ?? 'presidents'
    let words: string[] = []

    if (cachedLists.has(listName)) {
      words = cachedLists.get(listName)!
    } else {
      const path = join(assetsPath, `${listName}.txt`)
      const text = await readFile(path, 'utf-8')

      words = text
        .split(/\n\r|\n|\r/g)
        .filter((l) => !l.startsWith('#') && l.length > 0)

      cachedLists.set(listName, words)
    }

    currentGames.add(interaction.user.id)

    const id = randomUUID()
    const word = words[Math.floor(Math.random() * words.length)]
    const game = new Hangman(word, id)
    const m = await interaction.editReply(game.toJSON())

    const c = new InteractionCollector<ButtonInteraction | ModalSubmitInteraction>(interaction.client, {
      idle: seconds(30),
      filter: (i) =>
        (i.isButton() || i.isModalSubmit())
        && i.user.id === interaction.user.id
        && i.customId.endsWith(id)
    })

    for await (const [i] of c) {
      // There are 4 interaction types possible:
      //  1. Quit button (end game early);
      //  2. Hint button;
      //  3. Guess button;
      //  4. Modal submit (answer submitted)

      if (i.isButton()) {
        if (i.customId.startsWith('quit-')) {
          c.stop()

          await i.reply({
            content: stripIndents`
            OK, play again soon! ❤️

            By the way, the word was ${inlineCode(word)}.
            `,
            ephemeral: true
          })

          break
        } else if (i.customId.startsWith('hint-')) {
          const hint = game.hint()

          await i.reply({
            ...game.toJSON(),
            content: `❓ Your hint is ${hint}!`,
            ephemeral: true
          })

          await interaction.editReply({
            ...game.toJSON(),
            content: `❓ Your hint is ${hint}!`
          })

          continue
        }

        await i.showModal({
          title: 'Hangman',
          custom_id: `hangmanModal-${id}`,
          components: [
            Components.actionRow([
              Components.textInput({
                custom_id: `textInput-${id}`,
                label: 'Guess',
                style: TextInputStyle.Short,
                max_length: word.length,
                min_length: 1,
                required: true
              })
            ])
          ]
        })
      } else {
        const guess = i.fields.getField(`textInput-${id}`, ComponentType.TextInput).value.toLowerCase()
        const guessed = game.guess(guess)

        if (!guessed) {
          await i.reply({
            content: 'You can\'t guess that again!',
            ephemeral: true
          })
          continue
        }

        let json: WebhookMessageEditOptions | undefined = undefined
        if (game.winner) {
          json = game.toJSON('You guessed the word!')
          c.stop()
        } else if (game.lost) {
          json = game.toJSON(`You lost! The word was "${word}"!`)
          c.stop()
        } else if (guess.length === 1) {
          json = game.toJSON(
            !game.lastGuessWasWrong
              ? `"${guess.slice(0, 10)}" is in the word!`
              : `"${guess.slice(0, 10)}" is not in the word!`
          )
        } else {
          json = game.toJSON('Partial guesses are not allowed!')
        }

        await i.reply({
          ...json,
          content: `Checking your guess: ${inlineCode(guess)}.`,
          ephemeral: true
        })

        await interaction.editReply(json)
      }
    }

    await interaction.editReply({
      components: disableAll(m),
      content: c.endReason === 'idle'
        ? `By the way, the word was ${inlineCode(word)}!`
        : null
    })
  }
}
