import { request } from 'undici'

interface KongregateMetrics {
  gameplays_count: number
  favorites_count: number
  gameplays_count_with_delimiter: string
  favorites_count_with_delimiter: string
  game_statistics: string
  rating: string
  average_rating_text: string
  average_rating_with_count: string
  block_game_js: string
  quicklinks_user_rating: string
}

interface KongCache {
  lastFetched: number
  res: KongregateMetrics | null
}

const cache: KongCache = {
  lastFetched: -1,
  res: null
}

export const Kongregate = async (): Promise<KongregateMetrics | null> => {
  if ((Date.now() - cache.lastFetched) / 1000 / 60 < 5) {
    return cache.res
  }

  const { body } = await request('http://www.kongregate.com/games/Platonic/synergism/metrics.json')
  const json = (await body.json()) as KongregateMetrics

  cache.res = json
  cache.lastFetched = Date.now()
  return cache.res
}
