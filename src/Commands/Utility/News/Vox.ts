import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'

const settings = {
  rss: 'https://www.vox.com/rss/index.xml',
  main: 'https://vox.com',
  command: ['vox'],
  author: {
    name: 'Vox',
    iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Vox_logo.svg/1200px-Vox_logo.svg.png'
  }
} as const

interface IVox {
    published: string
    updated: string
    title: string
    content: string
    link: string
    id: string
    author: { name: string }
}

const rss = new RSSReader<IVox>()
const cache = once(async () => rss.cache(settings.rss))

export class kCommand extends Command {
  constructor () {
    super(
      [
        `Get the latest articles from ${settings.main}!`
      ],
      {
        name: settings.command[0],
        folder: 'News',
        args: [0, 0],
        aliases: settings.command.slice(1)
      }
    )
  }

  async init (): Promise<APIEmbed> {
    const state = await cache()

    if (state === null) {
      return Embed.error('Try again in a minute!')
    }

    if (rss.results.size === 0) {
      return Embed.error('An unexpected error occurred!')
    }

    const posts = [...rss.results.values()]
    return Embed.json({
      color: colors.ok,
      description: posts
        .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.id})`)
        .join('\n')
        .slice(0, 2048),
      author: settings.author
    })
  }
}
