import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { hours } from '#khaf/utility/ms.js'

const settings = {
  rss: 'https://www.newyorker.com/feed/everything',
  main: 'https://www.newyorker.com/',
  command: ['newyorker', 'thenewyorker'],
  author: {
    name: 'The New Yorker',
    iconURL: 'https://media.newyorker.com/photos/59096d7d6552fa0be682ff8f/1:1/w_68,c_limit/eustace-400.png'
  }
} as const

interface ITheNewYorker {
    title: string
    link: string
    guid: string
    pubDate: string
    'media:content': string
    description: string
    category: string
    'media:keywords': string
    'dc:modified': string
    'dc:publisher': string
    'media:thumbnail': string
}

const rss = new RSSReader<ITheNewYorker>(settings.rss)
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
