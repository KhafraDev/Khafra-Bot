import fetch, { Response } from 'undici-fetch';
import { chunkSafe } from '../Utility/Array.js';
import { dontThrow } from '../Utility/Don\'tThrow.js';
import { once } from '../Utility/Memoize.js';

interface CGCrypto {
    id: string
    name: string
    symbol: string
}

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

/**
 * Cache of all symbols and ids of supported cryptocurrencies on Coingecko
 */
export const symbolCache = new Set<string>();
export const cache = new Map<string, CoinGeckoRes | CoinGeckoRes[]>();
const strictlyIDs = new Set<string>();

const defaults = [
    // list all currencies
    'https://api.coingecko.com/api/v3/coins/list?include_platform=false',
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&sparkline=false'
] as const;

const list = async () => {
    const [err, r] = await dontThrow(fetch(defaults[0]));
    
    if (err !== null || !r.ok) 
        throw new Error(`Received status ${r.status}!`);

    const j = await r.json() as CGCrypto[];

    for (const { id, symbol } of j) {
        symbolCache.add(id);
        symbolCache.add(symbol);
        strictlyIDs.add(id);
    }
}

const all = async () => {
    if (symbolCache.size === 0)
        await list();

    const chunk = chunkSafe([...strictlyIDs], 250);
    const reqs = chunk.map(r => fetch(`${defaults[1]}&ids=${r.join(',')}`));
    const reqsChunk = chunkSafe(reqs, 5);

    for (const all of reqsChunk) {
        const success = await Promise.allSettled(all.map(p => dontThrow(p)));
        const filtered = success
            .filter((r): r is PromiseFulfilledResult<[Error, Response]> => r.status === 'fulfilled')
            .filter(r => r.value[0] === null && r.value[1].ok)
            .map(r => r.value[1].json() as Promise<CoinGeckoRes[]>);

        const json = await Promise.all(filtered);

        for (const currList of json) {
            for (const curr of currList) {
                // there are nearly 1,000 duplicate symbols but name and ids are all unique
                if (cache.has(curr.symbol)) {
                    const item = cache.get(curr.symbol)!;
                    const idx = Array.isArray(item) 
                        ? item.findIndex(i => i.id === curr.id)
                        : -1;

                    if (idx !== -1 && Array.isArray(item)) {
                        item[idx] = curr;
                        cache.set(curr.symbol, item);
                    } else {
                        cache.set(curr.symbol, Array.isArray(item) ? [...item, curr] : [item, curr]);
                    }
                } else {
                    cache.set(curr.symbol, curr);
                }

                cache.set(curr.id, curr);
            }
        }
    }
}

export const setCryptoInterval = once(async () => {
    await dontThrow(all());

    return setInterval(() => void dontThrow(all()), 60 * 1000 * 15).unref();
});