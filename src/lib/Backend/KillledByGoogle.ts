import fetch from 'node-fetch';

interface GoogleProduct {
    dateClose: string
    dateOpen: string
    description: string
    link: string
    name: string
    type: string
}

interface KilledByGoogleCache {
    total: number | null
    ageSorted: GoogleProduct[] | null
    categories: string[] | null
}

let interval: NodeJS.Timeout | null = null;
export const cache: KilledByGoogleCache = {
    total: null,
    ageSorted: null,
    categories: null
}

export const killedByGoogle = async () => {
    const res = await fetch('https://raw.githubusercontent.com/codyogden/killedbygoogle/main/graveyard.json');
    const json = await res.json() as GoogleProduct[];

    for (const k in cache) delete cache[k as keyof typeof cache];

    Object.defineProperties(cache, {
        total: {
            value: json.length,
            configurable: true, enumerable: true
        },
        ageSorted: {
            value: json.sort((a, b) => new Date(b.dateClose).getTime() - new Date(a.dateClose).getTime()),
            configurable: true, enumerable: true
        },
        categories: {
            value: [...new Set(json.map(i => i.type))],
            configurable: true, enumerable: true
        }
    });

    return cache;
}

export const kbgSetInterval = async () => {
    if (interval) return interval;
    await killedByGoogle().catch(() => {});
    interval = setInterval(() => 
        killedByGoogle().catch(() => {})
    , 60 * 1000 * 60);
}