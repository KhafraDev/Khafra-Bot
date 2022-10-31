import { once } from '#khaf/utility/Memoize.js'
import { s, type InferType } from '@sapphire/shapeshift'
import { URLSearchParams } from 'node:url'
import { Client } from 'undici'

const schema = s.object({
  id: s.string,
  symbol: s.string,
  name: s.string,
  asset_platform_id: s.unknown,
  platforms: s.record(s.string),
  block_time_in_minutes: s.number,
  hashing_algorithm: s.string,
  categories: s.string.array,
  public_notice: s.unknown,
  additional_notices: s.unknown,
  localization: s.record(s.string),
  description: s.record(s.string),
  links: s.unknown,
  image: s.record(s.string),
  country_origin: s.string,
  genesis_date: s.string,
  sentiment_votes_up_percentage: s.number,
  sentiment_votes_down_percentage: s.number,
  market_cap_rank: s.number,
  coingecko_rank: s.number,
  coingecko_score: s.number,
  developer_score: s.number,
  community_score: s.number,
  liquidity_score: s.number,
  public_interest_score: s.number,
  // market_data:
  market_data: s.object({
    current_price: s.record(s.number),
    high_24h: s.record(s.number),
    low_24h: s.record(s.number),
    market_cap: s.record(s.number),
    total_volume: s.record(s.number),
    circulating_supply: s.number,
    ath: s.record(s.number),
    ath_change_percentage: s.record(s.number),
    ath_date: s.record(s.string),
    atl: s.record(s.number),
    atl_change_percentage: s.record(s.number),
    atl_date: s.record(s.string),
    price_change_percentage_24h: s.number
  }),
  public_interest_stats: s.record(s.number.or(s.null)),
  status_updates: s.unknown.array,
  last_updated: s.string
}).ignore

const client = new Client('https://api.coingecko.com')
const options = new URLSearchParams({
  tickers: 'false',
  community_data: 'false',
  developer_data: 'false'
}).toString()

export class CoinGecko {
  static list = once(async () => {
    const { body } = await client.request({
      path: '/api/v3/coins/list?include_platform=false',
      method: 'GET'
    })

    const schema = s.object({
      id: s.string,
      name: s.string,
      symbol: s.string
    }).array

    const list: unknown = await body.json()

    if (!schema.is(list)) {
      return []
    }

    return list
  })

  static async get (query: string): Promise<InferType<typeof schema> | null> {
    const list = await CoinGecko.list() ?? []

    let cryptoId = ''
    const q = query.toLowerCase()

    for (const { id, name, symbol } of list) {
      if (id === q || symbol === q || name.toLowerCase() === q) {
        cryptoId = id
        break
      }
    }

    if (cryptoId === '') {
      return null
    }

    const { body, statusCode } = await client.request({
      path: `/api/v3/coins/${cryptoId}?${options}`,
      method: 'GET'
    })

    if (statusCode !== 200) {
      return null
    }

    const crypto: unknown = await body.json()

    if (!schema.is(crypto)) {
      return null
    }

    return crypto
  }
}
