/**
 * If you would like to see how documentation should be written,
 * look at how Twitter does it, and then do the EXACT OPPOSITE.
 */

import { Buffer } from 'node:buffer'
import { env } from 'node:process'
import { request } from 'undici'

type Indices = [number, number]
interface Media {
    id: number
    id_str: string
    indices: Indices
    media_url: string
    media_url_https: string
    url: string
    display_url: string
    expanded_url: string
    type: string
    sizes: {
        [K in 'thumb' | 'large' | 'small' | 'medium']: { w: number, h: number, resize: 'crop' | 'fit' }
    }
}

interface ExtendedMedia extends Media {
    video_info: {
        aspect_ratio: Indices
        variants: {
            bitrate: number
            content_type: string
            url: string
        }[]
    }
}

interface OAuth {
    token_type: string
    access_token: string
}

interface ITweet {
    created_at: string
    id: number
    id_str: string
    full_text: string
    truncated: boolean
    display_text_range: Indices
    entities: {
        hashtags: { text: string, indices: Indices }[]
        symbols: string[]
        user_mentions: string[]
        urls: string[]
        media?: Media
    }
    extended_entities?: {
        media: ExtendedMedia[]
    }
    source: string
    in_reply_to_status_id: unknown
    in_reply_to_status_id_str: unknown
    in_reply_to_user_id: unknown
    in_reply_to_user_id_str: unknown
    in_reply_to_screen_name: unknown
    user: {
        id: number
        id_str: string
        name: string
        screen_name: string
        location: string
        description: string
        url: unknown
        entities: { description: { urls: string[] } }
        protected: boolean
        followers_count: number
        friends_count: number
        listed_count: number
        created_at: string
        favourites_count: number
        utc_offset: unknown
        time_zone: unknown
        geo_enabled: boolean
        verified: boolean
        statuses_count: number
        lang: unknown
        contributors_enabled: boolean
        is_translator: boolean
        is_translation_enabled: boolean
        profile_background_color: string
        profile_background_image_url: string
        profile_background_image_url_https: string
        profile_background_tile: boolean
        profile_image_url: string
        profile_image_url_https: string
        profile_banner_url: string
        profile_link_color: string
        profile_sidebar_border_color: string
        profile_sidebar_fill_color: string
        profile_text_color: string
        profile_use_background_image: boolean
        has_extended_profile: boolean
        default_profile: boolean
        default_profile_image: boolean
        following: unknown
        follow_request_sent: unknown
        notifications: unknown
        translator_type: string
    }
    geo: unknown
    coordinates: unknown
    place: unknown
    contributors: unknown
    is_quote_status: boolean
    retweet_count: number
    favorite_count: number
    favorited: boolean
    retweeted: boolean
    lang: string
}

let token: string | null = null

const getTwitterOAUTH = async (): Promise<string> => {
    const creds = Buffer.from(`${env.TWITTER_API}:${env.TWITTER_API_SECRET}`).toString('base64')
    const { body } = await request('https://api.twitter.com/oauth2/token', {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${creds}`,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }
    })
    const j = await body.json() as OAuth
    return `${j.token_type} ${j.access_token}`
}

export const getTwitterMediaURL = async (id: string): Promise<string | undefined> => {
    token ??= await getTwitterOAUTH()

    const { body } = await request(`https://api.twitter.com/1.1/statuses/show.json?id=${id}&include_entities=true&tweet_mode=extended`, {
        headers: {
            Authorization: token
        }
    })

    const j = await body.json() as ITweet

    const media = j.extended_entities?.media
    if (!media || media.length === 0)
        return

    if (media[0]!.type === 'video' || media[0]!.type === 'animated_gif') {
        const medias = media[0]!.video_info.variants
        return medias
            .filter(u => u.content_type !== 'application/x-mpegURL')
            .map(m => m.url)
            .join('\n')
    }

    return media
        .map(m => m.media_url_https)
        .join('\n')
}