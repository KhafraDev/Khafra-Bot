import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { URL } from 'node:url'

const schema = s.string.url({
  allowedProtocols: ['http:', 'https:']
}).transform((value) => {
  const url = new URL(value)
  url.search = ''
  return url
})

const settings = {
  rss: 'https://www.oann.com/feed/',
  main: 'https://oann.com',
  command: ['oann'],
  author: {
    name: 'OANN',
    iconURL: 'https://d2pggiv3o55wnc.cloudfront.net/oann/wp-content/uploads/2019/10/OANtoplogo.jpg'
  }
} as const

interface IOANN {
    title: string
    link: string
    comments: string
    'dc:creator': string
    pubDate: string
    category: string
    guid: string
    description: string
    'wfw:commentRss': string
    'slash:comments': number
}

const rss = new RSSReader<IOANN>()
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

    const posts = [...rss.results.values()].map(p => {
      p.link = schema.parse(p.link).toString()
      return p
    })
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
