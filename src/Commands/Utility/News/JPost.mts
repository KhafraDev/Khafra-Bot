import { Command } from '#khaf/Command'
import { maxDescriptionLength } from '#khaf/utility/constants.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { RSSReader } from '#khaf/utility/RSS.mjs'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { hours } from '#khaf/utility/ms.mjs'

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

const rss = new RSSReader<IJPost>(settings.rss)
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
