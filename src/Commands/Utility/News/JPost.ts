import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'

const settings = {
  rss: 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx',
  main: 'https://jpost.com',
  command: ['jpost'],
  author: {
    name: 'JPost',
    iconURL: 'https://images.jpost.com/image/upload/f_auto,fl_lossy/t_JD_ExpertTopPic_1024/268438'
  }
} as const

interface IJPost {
    title: string
    link: string
    description: string
    Photographer: string
    pubDate: string
    UpdateDate: string
    itemID: string
    isPremium: string
    isVideo: string
    Author: string
    Sponsored: string
    Tags: string
    CategoryID: string
}

const rss = new RSSReader<IJPost>()
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
