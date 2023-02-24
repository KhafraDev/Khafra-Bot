import { Command } from '#khaf/Command'
import { maxDescriptionLength } from '#khaf/utility/constants.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { hours } from '#khaf/utility/ms.js'
import { URL } from 'node:url'

const schema = s.string.url({
  allowedProtocols: ['http:', 'https:']
}).transform((value) => {
  const url = new URL(value)
  url.search = ''
  return url
})

const settings = {
  rss: 'http://feeds.washingtonpost.com/rss/world?itid=lk_inline_manual_43',
  main: 'https://washingtonpost.com',
  command: ['washingtonpost', 'thewashingtonpost'],
  author: { name: 'The Washington Post', iconURL: 'https://i.imgur.com/TRRMCnb.png' }
} as const

interface IWashingtonPost {
    title: string
    link: string
    pubDate: string
    'dc:creator': string
    description: string
    'media:group': string
    guid: string
    'wp:arc_uuid': string
}

const rss = new RSSReader<IWashingtonPost>(settings.rss)
rss.save = 8
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

    const posts = [...rss.results.values()].map(p => {
      p.link = schema.parse(p.link).toString()
      return p
    })

    return Embed.json({
      color: colors.ok,
      description: posts
        .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
        .join('\n')
        .slice(0, maxDescriptionLength),
      author: settings.author
    })
  }
}
