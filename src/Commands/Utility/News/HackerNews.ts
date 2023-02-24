import { Command } from '#khaf/Command'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { minutes } from '#khaf/utility/ms.js'
import { s, type InferType } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import { format } from 'node:util'
import { request } from 'undici'

const top = 'https://hacker-news.firebaseio.com/v0/topstories.json'
const art = 'https://hacker-news.firebaseio.com/v0/item/%d.json'
const cache: InferType<typeof schema>[] = []
let lastFetched: number

const schema = s.object({
  by: s.string,
  descendants: s.number,
  id: s.number,
  kids: s.number.array,
  score: s.number,
  time: s.number,
  title: s.string,
  type: s.string,
  url: s.string
})

const fetchTop = async (): Promise<number[]> => {
  const { body } = await request(top)
  const j: unknown = await body.json()

  if (!s.number.array.is(j)) {
    return []
  }

  return j.slice(0, 10)
}

const fetchEntries = async (): Promise<InferType<typeof schema>[]> => {
  const ids = await fetchTop()
  cache.length = 0

  for (const id of ids) {
    const { body } = await request(format(art, id))
    const j: unknown = await body.json()

    if (schema.is(j)) {
      cache.push(j)
    }
  }

  return cache
}

export const fetchHN = async (): Promise<typeof cache> => {
  if (cache.length !== 0) {
    // If the cache is stale
    if (Date.now() - lastFetched! >= minutes(10)) {
      await fetchEntries()
      lastFetched = Date.now()
    }
  } else {
    await fetchEntries()
    lastFetched = Date.now()
  }

  return cache
}

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Fetch top articles from https://news.ycombinator.com/'
      ],
      {
        name: 'hackernews',
        folder: 'News',
        args: [0, 0],
        aliases: ['hn']
      }
    )
  }

  async init (): Promise<APIEmbed> {
    await fetchHN()

    if (cache.length === 0) {
      return Embed.error('Failed to fetch the articles!')
    }

    const stories = [...cache.values()]
    const list = stories
      .map((s,i) => `[${i+1}]: [${s.title}](${s.url})`)
      .join('\n')

    return Embed.ok(list)
  }
}
