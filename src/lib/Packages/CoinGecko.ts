import fetch, { Response } from 'node-fetch';
import { chunkSafe } from '../Utility/Array.js';

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
    ath_date: Date,
    atl: number,
    atl_change_percentage: number,
    atl_date: Date,
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
    const r = await fetch(defaults[0]);
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

    // so something here can error out, be completely ignored by the try/catch
    // and give no useful stack traces. Highly doubt this fixes it.
    try { 
        const reqs = chunkSafe([...strictlyIDs], 250)
            .map(r => fetch(`${defaults[1]}&ids=${r.join(',')}`));
        const reqsChunk = chunkSafe(reqs, 5) // await Promise.allSettled(reqs);

        cache.clear();

        for (const all of reqsChunk) {
            const success = (await Promise.allSettled(all))
                .filter((r): r is PromiseFulfilledResult<Response> => r.status === 'fulfilled')
                .filter(r => r.value.ok)
                .map(r => r.value.json() as Promise<CoinGeckoRes[]>);

            const json = await Promise.all(success);

            for (const currList of json) {
                for (const curr of currList) {
                    // there are nearly 1,000 duplicate symbols but name and ids are all unique
                    if (cache.has(curr.symbol)) {
                        const item = cache.get(curr.symbol)!;
                        cache.set(curr.symbol, Array.isArray(item) ? [...item, curr] : [item, curr]);
                    } else {
                        cache.set(curr.symbol, curr);
                    }

                    cache.set(curr.id, curr);
                }
            }
        }
    } catch {}
}

export const setCryptoInterval = async () => {
    try { await all() } catch {}

    setInterval(async () => {
        try {
            await all();
        } catch {}
    }, 60 * 1000 * 15);
}