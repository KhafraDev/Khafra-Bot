import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { hours } from '#khaf/utility/ms.js'

const settings = {
  rss: 'https://slate.com/feeds/all.rss',
  main: 'https://slate.com',
  command: ['slate'],
  author: {
    name: 'Slate',
    iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Slate_new_logo.png/250px-Slate_new_logo.png'
  }
} as const

interface ISlate {
    'slate:id': string
    title: string
    link: string
    pubDate: string
    guid: string
    description: string
    'dc:creator': string
    'media:content': {
        'media:credit': string
        'media:description': string
    }
}

const rss = new RSSReader<ISlate>(settings.rss)
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
