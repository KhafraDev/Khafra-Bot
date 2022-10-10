import { env } from 'node:process'
import { URLSearchParams } from 'node:url'
import { request } from 'undici'
import { s } from '@sapphire/shapeshift'
import { performance } from 'node:perf_hooks'

const schema = s.object({
    copyright: s.string.optional,
    date: s.string,
    explanation: s.string,
    hdurl: s.string.optional,
    media_type: s.string,
    service_version: s.string,
    title: s.string,
    url: s.string
}).ignore.array

interface NASACache {
    copyright: string | undefined
    link: string
    title: string
}

const hour = 60 * 1000 * 60

const ratelimit = {
    remaining: -1,
    firstRequest: -1
}

export const cache: NASACache[] = []

export const NASAGetRandom = async (): Promise<NASACache | null> => {
    const params = new URLSearchParams({
        count: '25',
        api_key: env.NASA ?? 'DEMO_KEY'
    })

    // ratelimited or cached results
    if (ratelimit.remaining === 0 && performance.now() - ratelimit.firstRequest < hour || cache.length >= 5)
        return cache.shift() ?? null

    const {
        body,
        headers,
        statusCode
    } = await request(`https://api.nasa.gov/planetary/apod?${params}`)

    const XRateLimitRemaining = headers['x-ratelimit-remaining']
    ratelimit.remaining = Number(XRateLimitRemaining)
    const now = performance.now()

    if (ratelimit.firstRequest === -1) {
        ratelimit.firstRequest = now
    } else if (now - ratelimit.firstRequest >= hour) {
        ratelimit.firstRequest = -1
    }

    if (statusCode !== 200) {
        return cache.shift() ?? null
    }

    const j: unknown = await body.json()

    if (!schema.is(j)) {
        return null
    }

    for (const { copyright, hdurl, url, title } of j) {
        cache.push({ copyright, link: hdurl ?? url, title })
    }

    return cache.shift() ?? null
}