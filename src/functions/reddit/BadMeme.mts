import { apiSchema, type Reddit } from '#khaf/functions/reddit/schema.mjs'
import { minutes } from '#khaf/utility/ms.mjs'
import { decodeXML } from 'entities'
import { setInterval } from 'node:timers'
import { URLSearchParams } from 'node:url'
import { request } from 'undici'
import { platform } from 'node:os'

export { type Reddit, apiSchema }

export interface IBadMemeCache {
  nsfw: boolean
  url: string | string[]
}

export const cache = new Map<string, Set<IBadMemeCache>>()
const lastUsed = new Map<string, number>()
const after = new Map<string, string>()

const getItemRespectNSFW = (
  subreddit: string,
  allowNSFW: boolean,
  cachedItems = cache.get(subreddit)
): IBadMemeCache | null => {
  if (!cachedItems || cachedItems.size === 0) {
    return null
  }

  const item = [...cachedItems].find(p => allowNSFW || !p.nsfw)
  if (item) {
    cachedItems.delete(item)
    cachedItems.size === 0
      ? cache.delete(subreddit)
      : cache.set(subreddit, cachedItems)
  }

  lastUsed.set(subreddit, Date.now())
  return item ?? null
}

export const badmeme = async (
  subreddit = 'dankmemes',
  nsfw = false,
  modifier: typeof SortBy[keyof typeof SortBy] = SortBy.NEW,
  timeframe: typeof Timeframe[keyof typeof Timeframe] = Timeframe.MONTH
): Promise<
    IBadMemeCache |
    { message: string, error: number, reason?: string } |
    null
> => {
  subreddit = subreddit.toLowerCase()

  if (cache.has(subreddit)) {
    return getItemRespectNSFW(subreddit, nsfw)
  }

  const o = new URLSearchParams({ limit: '20' })

  if (after.has(subreddit)) {
    o.set('after', after.get(subreddit)!)
  }

  if (modifier === SortBy.TOP) {
    o.set('t', timeframe)
  }

  // https://github.com/reddit-archive/reddit/wiki/API#rules
  // https://www.reddit.com/dev/api#GET_new
  const { body, statusCode } = await request(
    `https://www.reddit.com/r/${subreddit}/${modifier}.json?${o}`,
    {
      headers: {
        'user-agent': `${platform()}:KhafraBot:v1.0.0 (by /u/worthy, https://github.com/KhafraDev/Khafra-Bot)`
      }
    }
  )

  // When a subreddit doesn't exist, reddit automatically redirects to a search API URL.
  if (statusCode !== 200) {
    return {
      message: `Received status ${statusCode} when looking up posts for ${subreddit}.`,
      error: statusCode
    }
  }

  const j: unknown = await body.json().catch(() => null)

  if (!apiSchema.is(j)) {
    return {
      message: 'Invalid response.',
      error: 69
    }
  }

  if ('error' in j) {
    return j
  } else if (j.data.children.length === 0) {
    // No posts
    return null
  }

  const urls: IBadMemeCache[] = []

  for (const { data } of j.data.children) {
    if (data.is_self || 'crosspost_parent' in data) { // text posts
      continue
    }

    if (data.is_gallery && data.media_metadata) {
      const images: string[] = []

      for (const entry of Object.values(data.media_metadata)) {
        if (entry.status !== 'valid') {
          continue
        }

        const url = 'u' in entry.s ? entry.s.u : entry.s.mp4
        images.push(decodeXML(url))
      }

      urls.push({ nsfw: data.over_18, url: images })
      continue
    }

    urls.push({ nsfw: data.over_18, url: data.url })
  }

  const last = j.data.children.at(-1)!.data.name
  const cachedSet = new Set(urls)
  after.set(subreddit, last)
  cache.set(subreddit, cachedSet)

  return getItemRespectNSFW(subreddit, nsfw, cachedSet)
}

// https://www.jcchouinard.com/documentation-on-reddit-apis-json/

export const SortBy = {
  CONTROVERSIAL: 'controversial',
  BEST: 'best',
  HOT: 'hot',
  NEW: 'new',
  RANDOM: 'random',
  RISING: 'rising',
  TOP: 'top'
} as const

export const Timeframe = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  ALL: 'all'
} as const

setInterval(() => {
  const now = Date.now()
  for (const [subreddit, time] of lastUsed.entries()) {
    if (now - time >= minutes(10)) {
      lastUsed.delete(subreddit)
      cache.delete(subreddit)
      after.delete(subreddit)
    }
  }
}, minutes(10)).unref()
