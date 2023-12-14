import { inlineCode } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'

const MAX_DIFF = 2 ** 48 - 1

export class kCommand extends Command {
  constructor() {
    super(['Get a random number!', '100 250', '500'], {
      name: 'randomnum',
      aliases: ['randnum', 'randomint', 'randint'],
      folder: 'Fun',
      args: [1, 2],
      ratelimit: 5
    })
  }

  init(_message: Message, { args }: Arguments): APIEmbed {
    const [minStr, maxStr] = args.length === 2 ? args : ['0', ...args]
    const max = +maxStr + 1
    const min = +minStr

    if (
      max - min > MAX_DIFF || // difference set by function; difference can't be greater than this
      min < 0 ||
      max < 0 || // negative numbers aren't allowed
      min === max || // no range
      max < min || // min is greater than max
      !Number.isSafeInteger(min) ||
      !Number.isSafeInteger(max)
    ) {
      return Embed.error(
        `Invalid number(s) provided! Numbers ${inlineCode('cannot equal')} one another ` +
          `and the difference between the two ${inlineCode('cannot be greater')} than 2^48-1!`
      )
    }

    const num = Math.floor(Math.random() * (max - min) + min)

    return Embed.ok(`Your number is ${inlineCode(`${num}`)}!`)
  }
}
