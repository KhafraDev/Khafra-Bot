import { once } from '#khaf/utility/Memoize.js';
import { Client } from 'undici';
import { URLSearchParams } from 'node:url';

type CoingeckoDict<T = string> = Record<string, T>

interface Crypto {
    id: string
    symbol: string
    name: string
    asset_platform_id: unknown
    platforms: CoingeckoDict
    block_time_in_minutes: number
    hashing_algorithm: string
    categories: string[]
    public_notice: unknown
    additional_notices: unknown
    localization: CoingeckoDict
    description: CoingeckoDict
    links: CoingeckoDict<string | string[] | CoingeckoDict>
    image: CoingeckoDict
    country_origin: string
    genesis_date: string
    sentiment_votes_up_percentage: number
    sentiment_votes_down_percentage: number
    market_cap_rank: number
    coingecko_rank: number
    coingecko_score: number
    developer_score: number
    community_score: number
    liquidity_score: number
    public_interest_score: number
    market_data: CoingeckoDict<CoingeckoDict | null> & {
        current_price: CoingeckoDict<number>
        high_24h: CoingeckoDict<number>
        low_24h: CoingeckoDict<number>
        market_cap: CoingeckoDict<number>
        total_volume: CoingeckoDict<number>
        circulating_supply: number
        ath: CoingeckoDict<number>
        ath_change_percentage: CoingeckoDict<number>
        ath_date: CoingeckoDict<string>
        atl: CoingeckoDict<number>
        atl_change_percentage: CoingeckoDict<number>
        atl_date: CoingeckoDict<string>
        price_change_percentage_24h: number
    }
    public_interest_stats: CoingeckoDict<number | null>
    status_updates: unknown[]
    last_updated: string
}

const client = new Client('https://api.coingecko.com');
const options = new URLSearchParams({
    tickers: 'false',
    community_data: 'false',
    developer_data: 'false'
}).toString();

export class CoinGecko {
    static list = once(async () => {
        const { body } = await client.request({
            path: '/api/v3/coins/list?include_platform=false',
            method: 'GET'
        });

        return await body.json() as { id: string, name: string, symbol: string }[];
    });

    static async get (query: string): Promise<Crypto | null> {
        const list = await CoinGecko.list() ?? [];

        let cryptoId = '';
        const q = query.toLowerCase();

        for (const { id, name, symbol } of list) {
            if (id === q || symbol === q || name.toLowerCase() === q) {
                cryptoId = id;
                break
            }
        }

        if (cryptoId === '') {
            return null;
        }

        const { body, statusCode } = await client.request({
            path: `/api/v3/coins/${cryptoId}?${options}`,
            method: 'GET'
        });

        if (statusCode !== 200) {
            return null;
        }

        return body.json() as Promise<Crypto>;
    }
}