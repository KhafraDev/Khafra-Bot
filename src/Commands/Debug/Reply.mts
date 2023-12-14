import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'

export class kCommand extends Command {
  constructor() {
    super(['Have the bot reply to the user.'], {
      name: 'debug:reply',
      folder: 'Debug',
      args: [0, 0],
      ratelimit: 3
    })
  }

  init(message: Message): APIEmbed {
    return Embed.ok(`Hello, ${message.author}!`)
  }
}
