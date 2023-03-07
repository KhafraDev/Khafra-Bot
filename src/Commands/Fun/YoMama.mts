import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { assets } from '#khaf/utility/Constants/Path.mjs'
import { isText } from '#khaf/utility/Discord.js'
import { upperCase } from '#khaf/utility/String.mjs'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { readFileSync } from 'node:fs'

// "jokes"
let jokes: string[] | undefined

export class kCommand extends Command {
  constructor () {
    super(
      [
        'The most funny and epic jokes on the planet: Yo Mama jokes!'
      ],
      {
        name: 'yomama',
        folder: 'Fun',
        args: [0, 0]
      }
    )
  }

  init (message: Message): APIEmbed {
    jokes ??= readFileSync(assets('yomama.txt'), 'utf-8')
      .split(/\r?\n/g)
      .slice(0, -1)

    if (isText(message.channel) && !message.channel.nsfw)
      return Embed.error('🔞 This command only works in NSFW channels.')

    const joke = jokes[Math.floor(Math.random() * jokes.length)]
    return Embed.ok(upperCase(joke))
  }
}
