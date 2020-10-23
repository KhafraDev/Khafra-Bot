import fetch from 'node-fetch';

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

const cache: Record<string, CoinGeckoRes> = {};

const cryptoUpdate = async () => {
    for(let i = 1;;i++) {
        let res;
        try {
            res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${i}&sparkline=false`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
        } catch {
            break;
        }

        if(res.ok) {
            const json = (await res.json() as CoinGeckoRes[]).map(cc => ({ [cc.id]: cc }));
            if(json.length === 0) {
                break;
            }
            Object.assign(cache, ...json); // overwrites old values
        }
    }
}

export const getCurrency = (name: string): CoinGeckoRes => {
    name = name.toLowerCase();
    if(name in cache) {
        return cache[name];
    }

    // .id is already checked, no need to look for it again
    return Object.values(cache)
        .filter(c => c.symbol === name || c.name.toLowerCase() === name)
        .shift();
}

let interval: NodeJS.Timeout;
export const setCryptoInterval = async (ms: number) => {
    if(Object.keys(cache).length === 0) {
        await cryptoUpdate();
    }

    clearInterval(interval);
    interval = setInterval(cryptoUpdate, ms);
    return interval;
};