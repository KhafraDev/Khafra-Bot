import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'
import { request } from 'undici'
import { Command } from '#khaf/Command'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { RSSReader } from '#khaf/utility/RSS.mjs'
import { maxDescriptionLength } from '#khaf/utility/constants.mjs'
import { hours } from '#khaf/utility/ms.mjs'

interface ITheOnionAPI {
  data: {
    id: number
    permalinkRedirect: null
    parentId: unknown
    parentAuthorId: unknown
    parentAuthorIds: unknown
    starterId: number
    publishTimeMillis: number
    lastUpdateTimeMillis: number
    timezone: string
    sharedUrl: unknown
    salesAvatar: unknown
    sponsored: boolean
    adSettings: unknown
    status: string
    authorId: string
    authorIds: string[]
    allowReplies: boolean
    showAuthorBio: boolean
    byline: string
    showByline: boolean
    categorization: { channelId: string; sectionId: string }
    storyTypeId: unknown
    categoryId: unknown
    subcategoryId: unknown
    properties: string
    template: unknown
    isFeatured: boolean
    isVideo: boolean
    isRoundup: boolean
    relatedModule: unknown
    defaultBlogId: number
    approved: boolean
    headline: string
    headlineSfw: string
    subhead: unknown[]
    body: unknown[]
    lightbox: boolean
    imageRights: string
    hideCredit: boolean
    type: string
    permalink: string
    plaintext: string
  }[]
}

interface ITheOnion {
  title: string
  link: string
  description: string
  category: string[]
  pubDate: string
  guid: number
  'dc:creator': string
}

const rss = new RSSReader<ITheOnion>('https://www.theonion.com/rss')
const cache = once(() => rss.parse(), hours(12))

export class kCommand extends Command {
  constructor() {
    super(['Read one of the latest articles from The Onion!', ''], {
      name: 'theonion',
      folder: 'Fun',
      aliases: ['onion', 'realnews'],
      args: [0, 0]
    })
  }

  async init(): Promise<APIEmbed> {
    await cache()

    const i = Math.floor(Math.random() * rss.results.size)
    const id = [...rss.results][i].guid

    const { body } = await request(`https://theonion.com/api/core/corepost/getList?id=${id}`)
    const j = (await body.json()) as ITheOnionAPI

    if (j.data.length === 0)
      return Embed.error(`
      You'll have to read the article on TheOnion this time, sorry!
      https://www.theonion.com/${id}
      `)

    return Embed.json({
      color: colors.ok,
      author: {
        name: decodeXML(j.data[0].headline).slice(0, 256),
        icon_url: 'https://arc-anglerfish-arc2-prod-tronc.s3.amazonaws.com/public/3ED55FMQGXT2OG4GOBTP64LCYU.JPG',
        url: j.data[0].permalink
      },
      timestamp: new Date(j.data[0].publishTimeMillis).toISOString(),
      description: j.data[0].plaintext.slice(0, maxDescriptionLength)
    })
  }
}
