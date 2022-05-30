import { env } from 'node:process';
import { URLSearchParams } from 'node:url';
import { request } from 'undici';

interface IAPOD {
    copyright?: string
    date: string
    explanation: string
    hdurl?: string
    media_type: string
    service_version: string
    title: string
    url: string
}

interface NASACache {
    copyright: string | undefined
    link: string
    title: string
}

const hour = 60 * 1000 * 60;

const ratelimit = {
    remaining: -1,
    firstRequest: -1
};

export const cache: NASACache[] = [];

export const NASAGetRandom = async (): Promise<NASACache | null> => {
    const params = new URLSearchParams({
        count: '25',
        api_key: env.NASA ?? 'DEMO_KEY'
    });

    // ratelimited or cached results
    if (ratelimit.remaining === 0 && Date.now() - ratelimit.firstRequest < hour || cache.length >= 5)
        return cache.shift() ?? null;

    const {
        body,
        headers,
        statusCode
    } = await request(`https://api.nasa.gov/planetary/apod?${params}`);

    const XRateLimitRemaining = headers['x-ratelimit-remaining'];
    ratelimit.remaining = Number(XRateLimitRemaining);

    if (ratelimit.firstRequest === -1) {
        ratelimit.firstRequest = Date.now();
    } else if (Date.now() - ratelimit.firstRequest >= hour) {
        ratelimit.firstRequest = -1;
    }

    if (statusCode !== 200) {
        return cache.shift() ?? null;
    }

    const j = await body.json() as IAPOD[];

    for (const { copyright, hdurl, url, title } of j) {
        cache.push({ copyright, link: hdurl ?? url, title });
    }

    return cache.shift() ?? null;
}