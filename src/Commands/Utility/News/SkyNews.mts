import { Command } from '#khaf/Command'
import { maxDescriptionLength } from '#khaf/utility/constants.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { hours } from '#khaf/utility/ms.mjs'
import { RSSReader } from '#khaf/utility/RSS.mjs'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'

const settings = {
  rss: 'http://feeds.skynews.com/feeds/rss/world.xml',
  main: 'https://news.sky.com',
  command: ['sky', 'skynews'],
  author: { name: 'Sky News', iconURL: 'https://news.sky.com/resources/sky-news-logo.png?v=1?bypass-service-worker' }
} as const

interface ISkyNews {
  title: string
  link: string
  description: string
  pubDate: string
  guid: string
  enclosure: string
  'media:description': string
  'media:thumbnail': string
  'media:content': string
}

const rss = new RSSReader<ISkyNews>(settings.rss)
const cache = once(() => rss.parse(), hours(12))

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
