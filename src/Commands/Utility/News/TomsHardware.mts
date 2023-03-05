import { Command } from '#khaf/Command'
import { maxDescriptionLength } from '#khaf/utility/constants.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { RSSReader } from '#khaf/utility/RSS.mjs'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { hours } from '#khaf/utility/ms.mjs'

const settings = {
  rss: 'https://www.tomshardware.com/feeds/all',
  main: 'https://www.tomshardware.com/',
  command: ['tomshardware'],
  author: { name: 'Tom\'s Hardware', iconURL: 'https://vanilla.futurecdn.net/tomshardware/apple-touch-icon.png' }
} as const

interface ITomsHardware {
    title: string
    link: string
    description: string
    enclosure: string
    guid: string
    pubDate: string
}

const rss = new RSSReader<ITomsHardware>(settings.rss)
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
