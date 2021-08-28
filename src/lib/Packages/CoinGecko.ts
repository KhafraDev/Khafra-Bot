import { fetch } from 'undici';
import { once } from '../Utility/Memoize.js';
import { dontThrow } from '../Utility/Don\'tThrow.js';
import { chunkSafe } from '../Utility/Array.js';

interface CoinGeckoRes {
    id: string,
    symbol: string,
    name: string,
    image: string,
    current_price: number,
    market_cap: number,
    market_cap_rank: number,
    fully_diluted_valuation?: number | null,
    total_volume: number,
    high_24h: number,
    low_24h: number,
    price_change_24h: number,
    price_change_percentage_24h: number,
    market_cap_change_24h: number,
    market_cap_change_percentage_24h: number,
    circulating_supply: number,
    total_supply?: number | null,
    max_supply?: number | null,
    ath: number,
    ath_change_percentage: number,
    ath_date: string,
    atl: number,
    atl_change_percentage: number,
    atl_date: string,
    roi?: {
        times: number,
        currency: string,
        percentage: number
    } | null,
    last_updated: Date
}

export class CoinGecko {
    static cache = new Map<string, CoinGeckoRes>();
    static cache2: { id: string, name: string, symbol: string }[] = [];

    private static last: number;
    private static int: NodeJS.Timer;

    static interval = once(() => {
        if (!CoinGecko.int) {
            CoinGecko.int = setInterval(
                () => void dontThrow(CoinGecko.fetchAll()),
                60 * 1000 * 30
            ).unref();
        }
    });

    static list = once(async () => {
        const r = await fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=false');
        const j = await r.json() as typeof CoinGecko.cache2;

        CoinGecko.cache2.push(...j);

        return j;
    });

    static async ping() {
        const [e, r] = await dontThrow(fetch(`https://api.coingecko.com/api/v3/ping`));
        
        return e === null && r.ok;
    }

    static async fetchAll() {
        if (!CoinGecko.last) {
            CoinGecko.last = Date.now();
        } else if ((Date.now() - CoinGecko.last) / 1000 / 60 < 15) { // tried within last 15 mins
            return;    
        }
        
        const pinged = await CoinGecko.ping();
        if (pinged === false) return;

        const list = await CoinGecko.list();
        const ids = list.map(i => i.id);

        for (const idChunk of chunkSafe(ids, 250)) {
            const [e, r] = await dontThrow(fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idChunk.join(',')}`));
            if (e !== null || !r.ok) break;

            const j = await r.json() as CoinGeckoRes[];

            for (const currency of j) {
                CoinGecko.cache.set(currency.id, currency);
            }
        }

        if (!CoinGecko.int) CoinGecko.interval();

        return true;
    }

    static async get(query: string, cb = () => {}) {
        if (CoinGecko.cache2.length === 0 || CoinGecko.cache.size === 0) {
            cb();
            const success = await CoinGecko.fetchAll();
            if (success !== true) return;
        }

        const found: CoinGeckoRes[] = [];
        const q = query.toLowerCase();

        for (const { id, name, symbol } of CoinGecko.cache2) {
            if (id === q || symbol === q || name.toLowerCase() === q) {
                found.push(CoinGecko.cache.get(id)!);
            }
        }

        return found;
    }
}