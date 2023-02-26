import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { stripIndents } from '#khaf/utility/Template.js'
import { inlineCode } from '@discordjs/builders'
import type { Message } from 'discord.js'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Test the stripIndents function.'
      ],
      {
        name: 'debug:stripindents',
        folder: 'Debug',
        args: [1],
        ratelimit: 3
      }
    )
  }

  init (_message: Message, { content }: Arguments): string {
    return stripIndents`
        ${inlineCode(content.slice(0, 2040))}
        `
  }
}
