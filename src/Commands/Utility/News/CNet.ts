import { Command } from '#khaf/Command'
import { maxDescriptionLength } from '#khaf/utility/constants.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { hours } from '#khaf/utility/ms.js'

const settings = {
  rss: 'https://www.cnet.com/rss/all/',
  main: 'https://www.cnet.com/',
  command: ['cnet'],
  author: { name: 'CNet', iconURL: 'http://www.ranklogos.com/wp-content/uploads/2012/04/CNET_Logo.jpg' }
} as const

interface ICNet {
    title: string
    link: string
    guid: string
    pubDate: string
    description: string
    'media:thumbnail': string
    'dc:creator': string
}

const rss = new RSSReader<ICNet>(settings.rss)
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
        .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
        .join('\n')
        .slice(0, maxDescriptionLength),
      author: settings.author
    })
  }
}
