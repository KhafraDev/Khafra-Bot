import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'

const settings = {
  rss: 'https://news.google.com/rss/search?q=when:24h+allinurl:apnews.com&ceid=US:en&hl=en-US&gl=US',
  main: 'https://apnews.com',
  command: ['apnews', 'ap'],
  author: { name: 'AP News', iconURL: 'https://i.imgur.com/CvS6WHb.png' }
} as const

interface IAPNews {
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    source: string
}

const rss = new RSSReader<IAPNews>()
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
        .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
        .join('\n')
        .slice(0, 2048),
      author: settings.author
    })
  }
}
