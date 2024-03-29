import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { hours } from '#khaf/utility/ms.mjs'
import { RSSReader } from '#khaf/utility/RSS.mjs'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'

interface IxKCD {
  title: string
  link: string
  description: string
  pubDate: string
  guid: string
}

const rss = new RSSReader<IxKCD>('https://xkcd.com/rss.xml')
const cache = once(() => rss.parse(), hours(12))

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get a random comic from xKCD!'
      ],
      {
        name: 'xkcd',
        folder: 'Games',
        args: [0, 0],
        ratelimit: 5
      }
    )
  }

  async init (): Promise<APIEmbed> {
    await cache()

    const values = Array.from(rss.results)
    const comic = values[Math.floor(Math.random() * values.length)]

    return Embed.json({
      color: colors.ok,
      title: decodeXML(comic.title),
      url: comic.link,
      image: { url: `${/src="(.*?)"/.exec(comic.description)?.[1]}` }
    })
  }
}
