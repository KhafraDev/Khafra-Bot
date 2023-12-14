import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { Command } from '#khaf/Command'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { RSSReader } from '#khaf/utility/RSS.mjs'
import { maxDescriptionLength } from '#khaf/utility/constants.mjs'
import { hours } from '#khaf/utility/ms.mjs'

const settings = {
  rss: 'https://deadline.com/feed/',
  main: 'https://deadline.com/',
  command: ['deadline'],
  author: {
    name: 'Deadline',
    iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Deadline_logo.svg/1280px-Deadline_logo.svg.png'
  }
} as const

interface IDeadline {
  title: string
  link: string
  comments: string
  'dc:creator': string
  pubDate: string
  category: string[]
  guid: string
  description: string
  'wfw:commentRss': string
  'slash:comments': number
  'media:thumbnail': string
  'media:content': { 'media:title': string }
}

const rss = new RSSReader<IDeadline>(settings.rss)
const cache = once(() => rss.parse(), hours(12))

export class kCommand extends Command {
  constructor() {
    super([`Get the latest articles from ${settings.main}!`], {
      name: settings.command[0],
      folder: 'News',
      args: [0, 0],
      aliases: settings.command.slice(1)
    })
  }

  async init(): Promise<APIEmbed> {
    await cache()

    if (rss.results.size === 0) {
      return Embed.error('An unexpected error occurred!')
    }

    const posts = [...rss.results.values()]
    return Embed.json({
      color: colors.ok,
      description: posts
        .map((p, i) => `[${i + 1}] [${decodeXML(p.title)}](${p.link})`)
        .join('\n')
        .slice(0, maxDescriptionLength),
      author: settings.author
    })
  }
}
