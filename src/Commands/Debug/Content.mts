import { codeBlock } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'

export class kCommand extends Command {
  constructor() {
    super(
      [
        'Get the content of a message stringified (guild emojis, etc.).',
        '<guildemoji:1294020340213912>',
        'testing stuff?'
      ],
      {
        name: 'debug:content',
        folder: 'Debug',
        args: [1],
        ratelimit: 3
      }
    )
  }

  init(_message: Message, { content }: Arguments): APIEmbed {
    return Embed.ok(codeBlock(content))
  }
}
