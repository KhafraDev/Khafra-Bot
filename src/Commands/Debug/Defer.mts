import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import type { Message } from 'discord.js'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Delete the message reference and then send a message.'
      ],
      {
        name: 'debug:defer',
        folder: 'Debug',
        args: [0, 0],
        ratelimit: 5
      }
    )
  }

  async init (message: Message): Promise<void> {
    if (message.deletable)
      await message.delete()
    await message.reply({
      embeds: [
        Embed.error('If you\'re seeing this, something went wrong...')
      ]
    })
  }
}
