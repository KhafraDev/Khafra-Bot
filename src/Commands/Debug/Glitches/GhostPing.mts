import type { Message, MessageReplyOptions } from 'discord.js'
import { Command } from '#khaf/Command'

const base = `Ghost Pinged! ${'||**⃣**||'.repeat(218)}`

export class kCommand extends Command {
  constructor() {
    super(
      [
        'Ghost ping yourself! Bug [here](https://bugs.discord.com/T812#28651); ' +
          'message [here](https://paste.ee/p/4IcZq).'
      ],
      {
        name: 'hacks:ghostping',
        folder: 'Debug',
        args: [0, 0],
        ratelimit: 3,
        aliases: ['hacks:ghost'],
        send: true
      }
    )
  }

  init(message: Message): MessageReplyOptions {
    return { content: `${base} ${message.member}` }
  }
}
