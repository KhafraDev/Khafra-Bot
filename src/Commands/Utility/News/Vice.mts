import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { Command } from '#khaf/Command'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { RSSReader } from '#khaf/utility/RSS.mjs'
import { maxDescriptionLength } from '#khaf/utility/constants.mjs'
import { hours } from '#khaf/utility/ms.mjs'

const settings = {
  rss: 'https://www.vice.com/en/rss?locale=en_us',
  main: 'https://vice.com',
  command: ['vice'],
  author: {
    name: 'Vice',
    iconURL: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c0/Vice_logo.svg/220px-Vice_logo.svg.png'
  }
} as const

interface IVice {
  title: string
  link: string
  pubDate: string
  description: string
  'content:encoded': string
  guid: string
  enclosure: string
  'dc:creator': string[]
  category: string[]
}

const rss = new RSSReader<IVice>(settings.rss)
const cache = once(() => rss.parse(), hours(12))

export class kCommand extends Command {
  constructor() {
    super([`Get the latest articles from ${settings.main}!`], {
      name: settings.command[0],
      folder: 'News',
      args: [0, 0],
      aliases: settings.command.slice(1)
    })
  }

  async init(): Promise<APIEmbed> {
    await cache()

    if (rss.results.size === 0) {
      return Embed.error('An unexpected error occurred!')
    }

    const posts = [...rss.results.values()]
    return Embed.json({
      color: colors.ok,
      description: posts
        .map((p, i) => `[${i + 1}] [${decodeXML(p.title)}](${p.link})`)
        .join('\n')
        .slice(0, maxDescriptionLength),
      author: settings.author
    })
  }
}
