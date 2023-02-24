import { Command } from '#khaf/Command'
import { maxDescriptionLength } from '#khaf/utility/constants.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { hours } from '#khaf/utility/ms.js'

const settings = {
  rss: 'https://feeds.thedailybeast.com/rss/articles',
  main: 'https://www.thedailybeast.com/',
  command: ['dailybeast', 'thedailybeast'],
  author: {
    name: 'The Daily Beast',
    iconURL: 'https://img.thedailybeast.com/image/upload/v1550872986/Whitelr_soctf0.png'
  }
} as const

interface IDailyBeast {
    title: string
    description: string
    link: string
    guid: string
    category: string
    'dc:creator': string
    pubDate: string
}

const rss = new RSSReader<IDailyBeast>(settings.rss)
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
