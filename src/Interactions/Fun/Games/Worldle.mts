import { KhafraClient } from '#khaf/Bot'
import { InteractionSubCommand } from '#khaf/Interaction'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { assets } from '#khaf/utility/Constants/Path.mjs'
import { minutes } from '#khaf/utility/ms.mjs'
import { stripIndents } from '#khaf/utility/Template.mjs'
import { inlineCode } from '@discordjs/builders'
import { TextInputStyle } from 'discord-api-types/v10'
import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  ComponentType,
  InteractionCollector,
  type InteractionEditReplyOptions,
  type InteractionReplyOptions,
  type ModalSubmitInteraction
} from 'discord.js'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'

type CountryJson = typeof import('../../../../assets/worldle/countries.json')
type CompareCoordsFn<T> = (x: CountryJson[number], y: CountryJson[number]) => T

let countries: CountryJson | undefined
let codes: Map<string, string> | undefined
const currentGames = new Set<string>()

// https://www.movable-type.co.uk/scripts/latlong.html
const getDistance: CompareCoordsFn<number> = (x, y) => {
  const lat1 = Number(x.lat)
  const lat2 = Number(y.lat)
  const lon1 = Number(x.lon)
  const lon2 = Number(y.lon)

  const R = 6371e3
  const φ1 = lat1 * Math.PI / 180 // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
    + Math.cos(φ1) * Math.cos(φ2)
      * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return (R * c) / 1000 // km
}

const getDirection: CompareCoordsFn<string> = (a, b) => {
  const lat1 = Number(a.lat) * Math.PI / 180
  const lat2 = Number(b.lat) * Math.PI / 180
  const lon1 = Number(a.lon) * Math.PI / 180
  const lon2 = Number(b.lon) * Math.PI / 180

  const x = Math.sin(lon2 - lon1) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  const bearing = Math.atan2(x, y) * (180 / Math.PI)

  const angle = (bearing + 360) % 360
  const index = Math.round(angle / 22.5)
  const directions = ['⬆️', '↗️', '↗️', '↗️', '➡️', '↘️', '↘️', '↘️', '⬇️', '↙️', '↙️', '↙️', '⬅️', '↖️', '↖️', '↖️']

  return directions[index % 16]
}

// Dice's coefficient
const compareTwoStrings = (X: string, Y: string): number => {
  let inBoth = 0

  for (let i = 0; i < Y.length - 1; i++) {
    if (X.includes(Y[i] + Y[i + 1])) {
      inBoth++
    }
  }

  return (2 * inBoth) / (X.length - 1 + Y.length - 1)
}

const replyOptions = async (
  id: string,
  guesses: CountryJson[number][],
  country: CountryJson[number]
): Promise<InteractionEditReplyOptions> => {
  const image = await readFile(assets('worldle', `${country.code.toLowerCase()}.png`))
  let description = ''
  let content: string | undefined

  for (const guess of guesses) {
    const distance = getDistance(country, guess)
    const direction = getDirection(guess, country)

    description += `${guess.country} ${distance.toLocaleString()}km ${direction}\n`
  }

  if (guesses.some((guess) => guess.code === country.code)) {
    content = `You won, the country was ${inlineCode(country.country)}!`
  } else if (guesses.length >= 6) {
    content = `You lost, the country was ${inlineCode(country.country)}.`
  }

  return {
    content,
    embeds: [
      Embed.json({
        image: {
          url: 'attachment://nice-try.png'
        },
        description
      })
    ],
    files: [{
      attachment: image,
      name: 'nice-try.png'
    }],
    components: [
      Components.actionRow([
        Buttons.approve('Guess', `guess-${id}`, { disabled: !!content }),
        Buttons.deny('Quit', `quit-${id}`, { disabled: !!content })
      ])
    ]
  }
}

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'games',
      name: 'worldle'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
    if (currentGames.has(interaction.user.id)) {
      return {
        content: 'You\'re already in a game!',
        ephemeral: true
      }
    }

    currentGames.add(interaction.user.id)
    countries ??= JSON.parse(readFileSync(assets('worldle', 'countries.json'), 'utf-8')) as typeof countries
    codes ??= new Map<string, string>(
      KhafraClient.walk(assets('worldle'), (p) => p.endsWith('.png'))
        .map((filePath) => [basename(filePath, '.png'), filePath])
    )

    // For typescript
    assert(countries)

    const id = randomUUID()
    const countryCode = [...codes.keys()][Math.floor(Math.random() * codes.size)]
    const country = countries.find(({ code }) => code.toLowerCase() === countryCode)!
    const guesses: CountryJson[number][] = []

    const reply = await interaction.editReply(await replyOptions(id, guesses, country))

    const c = new InteractionCollector<ButtonInteraction | ModalSubmitInteraction>(interaction.client, {
      idle: minutes(5),
      filter: (i) =>
        (i.isButton() || i.isModalSubmit())
        && i.user.id === interaction.user.id
        && i.customId.endsWith(id)
    })

    for await (const [i] of c) {
      // There are 3 interaction types possible:
      //  1. Quit button (end game early);
      //  2. Guess button;
      //  3. Modal submit (answer submitted)

      if (i.isButton()) {
        if (i.customId.startsWith('quit-')) {
          c.stop()

          await i.reply({
            content: stripIndents`
            OK, play again soon! ❤️

            By the way, the country was ${inlineCode(country.country)}.
            `,
            ephemeral: true
          })

          break
        }

        await i.showModal({
          title: 'Worldle 🌎',
          custom_id: `worldleModal-${id}`,
          components: [
            Components.actionRow([
              Components.textInput({
                custom_id: `textInput-worldle-${id}`,
                label: 'Guess',
                style: TextInputStyle.Short,
                min_length: 1,
                required: true
              })
            ])
          ]
        })
      } else {
        const guess = i.fields.getField(
          `textInput-worldle-${id}`,
          ComponentType.TextInput
        ).value.toLowerCase()

        const isValidGuess = countries.find((country) => country.country.toLowerCase() === guess)

        if (!isValidGuess) {
          const closest: ({ country: typeof countries[number]; distance: number })[] = []

          for (const country of countries) {
            const distance = compareTwoStrings(guess, country.country.toLowerCase())

            if (distance > .5) {
              closest.push({ country, distance })
            }
          }

          const sorted = closest
            .sort((a, b) => b.distance - a.distance)
            .slice(0, 50)
            .map((country) => country.country.country) // ...
            .join('\n')

          await i.reply({
            content: stripIndents`
            Sorry, I don't know about "${guess}". Did you mean any of these?
            
            ${sorted}
            `,
            ephemeral: true
          })

          continue
        }

        guesses.push(isValidGuess)

        if (isValidGuess.code === country.code) {
          await i.reply({
            content: `You won, the country was ${inlineCode(country.country)}!`,
            ephemeral: true
          })

          await interaction.editReply(await replyOptions(id, guesses, country))

          break
        } else if (guesses.length >= 6) {
          await i.reply({
            content: stripIndents`
            You lost, the country was ${inlineCode(country.country)}.
            `,
            ephemeral: true
          })

          await interaction.editReply(await replyOptions(id, guesses, country))

          break
        }

        const json = await replyOptions(id, guesses, country)

        await i.reply({
          ...json,
          content: `Checking your guess: ${inlineCode(guess)}.`,
          ephemeral: true
        })

        await interaction.editReply(json)
      }
    }

    currentGames.delete(interaction.user.id)

    if (c.endReason === 'idle') {
      await interaction.editReply({
        components: disableAll(reply),
        content: `By the way, the country was ${inlineCode(country.country)}!`
      })
    }
  }
}
