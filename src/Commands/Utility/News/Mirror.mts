import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { Command } from '#khaf/Command'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { RSSReader } from '#khaf/utility/RSS.mjs'
import { maxDescriptionLength } from '#khaf/utility/constants.mjs'
import { hours } from '#khaf/utility/ms.mjs'

const settings = {
  rss: 'https://www.mirror.co.uk/news/world-news/?service=rss',
  main: 'https://www.mirror.co.uk',
  command: ['mirror'],
  author: { name: 'Mirror', iconURL: 'https://i.imgur.com/wuINM4z.png' }
} as const

interface IMirrorCo {
  title: string
  link: string
  guid: string
  description: string
  pubDate: string
  category: string
  'media:thumbnail': string
  enclosure: string
  'media:content': string
  'media:keywords': string
}

const rss = new RSSReader<IMirrorCo>(settings.rss)
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
