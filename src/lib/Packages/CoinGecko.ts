import { chunkSafe } from '#khaf/utility/Array.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { consumeBody } from '#khaf/utility/FetchUtils.js';
import { once } from '#khaf/utility/Memoize.js';
import { setInterval } from 'node:timers';
import { Client } from 'undici';

interface CoinGeckoRes {
    id: string
    symbol: string
    name: string
    image: string
    current_price: number
    market_cap: number
    market_cap_rank: number
    fully_diluted_valuation?: number | null
    total_volume: number
    high_24h: number
    low_24h: number
    price_change_24h: number
    price_change_percentage_24h: number
    market_cap_change_24h: number
    market_cap_change_percentage_24h: number
    circulating_supply: number
    total_supply?: number | null
    max_supply?: number | null
    ath: number
    ath_change_percentage: number
    ath_date: string
    atl: number
    atl_change_percentage: number
    atl_date: string
    roi?: {
        times: number
        currency: string
        percentage: number
    } | null
    last_updated: Date
}

const client = new Client('https://api.coingecko.com');

export class CoinGecko {
    public static cache = new Map<string, CoinGeckoRes>();
    private static last: number;

    static list = once(async () => {
        const { body } = await client.request({
            path: '/api/v3/coins/list?include_platform=false',
            method: 'GET'
        });

        return await body.json() as { id: string, name: string, symbol: string }[];
    });

    static async ping(): Promise<boolean> {
        const [e, r] = await dontThrow(client.request({
            path: '/api/v3/ping',
            method: 'GET'
        }));

        await consumeBody(r);

        return e === null && r.statusCode === 200;
    }

    static async fetchAll(): Promise<boolean> {
        if (typeof CoinGecko.last !== 'number') {
            setInterval(
                () => void dontThrow(CoinGecko.fetchAll()),
                60 * 1000 * 30
            ).unref();
            CoinGecko.last = Date.now();
        } else if ((Date.now() - CoinGecko.last) / 1000 / 60 < 15) { // tried within last 15 mins
            return false;
        }

        const pinged = await CoinGecko.ping();
        if (pinged === false) return false;

        const list = await CoinGecko.list();
        const ids = list ? list.map(i => i.id) : [];

        for (const idChunk of chunkSafe(ids, 250)) {
            const [e, r] = await dontThrow(client.request({
                path: `/api/v3/coins/markets?vs_currency=usd&ids=${idChunk.join(',')}`,
                method: 'GET'
            }));

            if (e !== null || r.statusCode !== 200) {
                void consumeBody(r);
                break;
            }

            const j = await r.body.json() as CoinGeckoRes[];

            for (const currency of j) {
                CoinGecko.cache.set(currency.id, currency);
            }
        }

        return true;
    }

    static async get(query: string, cb = (): void => {}): Promise<CoinGeckoRes[] | undefined> {
        if (CoinGecko.cache.size === 0) {
            cb();
            const success = await CoinGecko.fetchAll();
            if (success !== true) return;
        }

        const list = await CoinGecko.list() ?? [];

        const found: CoinGeckoRes[] = [];
        const q = query.toLowerCase();

        for (const { id, name, symbol } of list) {
            if (id === q || symbol === q || name.toLowerCase() === q) {
                found.push(CoinGecko.cache.get(id)!);
            }
        }

        return found;
    }
}