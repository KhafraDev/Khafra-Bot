import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const symbol = String.fromCodePoint(Number.parseInt('202B', 16))
const clean = 'The edit button won\'t be where you expect it to be!'
const edited = `The edit button is right there -> ${symbol} !Over here ->`

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Place an edit button in the middle of a message!'
      ],
      {
        name: 'hacks:edit',
        folder: 'Debug',
        args: [0, 0],
        ratelimit: 3
      }
    )
  }

  async init (message: Message): Promise<undefined | APIEmbed> {
    const m = await message.reply({ content: clean })

    if (m.editable) {
      return void m.edit({ content: edited })
    } else {
      return Embed.error('Message wasn\'t editable!')
    }
  }
}
