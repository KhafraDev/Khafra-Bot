import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'

const settings = {
  rss: 'https://www.thecipherbrief.com/feed',
  main: 'https://thecipherbrief.com',
  command: ['thecipherbrief', 'cipherbrief'],
  author: { name: 'The Cipher Brief', iconURL: 'https://www.thecipherbrief.com/wp-content/uploads/2017/07/cropped-logo-768x228.png' }
} as const

interface ICipherBrief {
    title: string
    link: string
    comments: string
    pubDate: string
    'dc:creator': string
    category: string
    guid: string
    description: string
    'wfw:commentRss': string
    'slash:comments': string
}

const rss = new RSSReader<ICipherBrief>()
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
