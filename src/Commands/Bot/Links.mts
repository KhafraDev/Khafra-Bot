import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import type { APIEmbed } from 'discord-api-types/v10'

export class kCommand extends Command {
  constructor () {
    super([], {
      name: 'links',
      folder: 'Bot',
      args: [0, 0],
      ratelimit: 3,
      aliases: ['link']
    })
  }

  init (): APIEmbed {
    return Embed.ok(`
    [Khafra-Bot GitHub](https://github.com/khafradev/khafra-bot)
    [Synergism Discord](https://discord.gg/synergism)

    Want to help the bot? [Donate to Platonic](https://patreon.com/synergism). :)
    `)
  }
}
