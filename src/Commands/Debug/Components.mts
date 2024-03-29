import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Buttons, Components } from '#khaf/utility/Constants/Components.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { randomUUID } from 'node:crypto'

const schema = s.number.greaterThanOrEqual(1).lessThanOrEqual(5)

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Send a message with a given number of random buttons attached.',
        '1',
        '5'
      ],
      {
        name: 'debug:components',
        folder: 'Debug',
        args: [1, 1],
        aliases: ['debug:buttons', 'debug:button'],
        ratelimit: 3
      }
    )
  }

  async init (message: Message, { args }: Arguments): Promise<undefined | APIEmbed> {
    const amount = Number(args[0])
    if (!schema.is(amount)) {
      return Embed.error('Invalid number of buttons to add!')
    }

    const row = Components.actionRow()
    const keys = Object.keys(Buttons) as (keyof typeof Buttons)[]
    keys.splice(keys.indexOf('link'), 1)

    for (let i = 0; i < amount; i++) {
      const type = keys[Math.floor(Math.random() * keys.length)]
      const disabled = Boolean(Math.round(Math.random()))
      const button = Buttons[type as Exclude<keyof typeof Buttons, 'link'>](type, randomUUID())
      button.disabled = disabled

      row.components.push(button)
    }

    await message.reply({
      content: 'Debug message!',
      components: [row]
    })
  }
}
