import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'

export class kCommand extends Command {
  constructor() {
    super(['Have KhafraBot say something!', 'Have a great day!', 'You suck.'], {
      name: 'say',
      folder: 'Fun',
      aliases: ['speak', 'talk', 'tell'],
      args: [1],
      ratelimit: 3
    })
  }

  init(message: Message, { args }: Arguments): APIEmbed {
    return Embed.json({
      color: colors.ok,
      author: {
        name: message.author.username,
        icon_url: message.author.displayAvatarURL()
      },
      description: args.join(' ')
    })
  }
}
