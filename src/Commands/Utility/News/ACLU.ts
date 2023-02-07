import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { hours } from '#khaf/utility/ms.js'

const settings = {
  rss: 'https://wp.api.aclu.org/feed/',
  main: 'https://aclu.org',
  command: ['aclu'],
  author: { name: 'ACLU', iconURL: 'https://www.aclu.org/shared/images/favicons/android-chrome-192x192.png' }
} as const

interface IACLU {
    title: string
    link: string
    'dc:creator': string
    pubDate: 'Thu, 24 Jun 2021 16:02:00 +0000'
    category: string[]
    guid: string
    description: string
    'content:encoded': string
}

const rss = new RSSReader<IACLU>(settings.rss)
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
        .slice(0, 4096),
      author: settings.author
    })
  }
}
