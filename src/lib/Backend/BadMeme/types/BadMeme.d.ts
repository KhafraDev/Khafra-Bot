type GalleryData = {
    y: number
    x: number
    u: string
}

type RedditVideoData = {
    url: string
    width: number
    height: number
}

type RedditVideo = {
    reddit_video: {
        bitrate_kbps: number
        fallback_url: string
        height: number
        width: number
        scrubber_media_url: string
        dash_url: string
        duration: number
        hls_url: string
        is_gif: boolean
        transcoding_status: string
    }
}

type RedditImagePreview = {
    source: RedditVideoData
    resolutions: RedditVideoData[]
    variants: any
    id: string
}

type RedditOEmbed<T extends string> = {
    provider_url: T,
    description: string,
    title: string
    type: string
    author_name: string
    height: number
    width: number
    html: string
    thumbnail_width: number
    version: string
    provider_name: string
    thumbnail_url: string
    thumbnail_height: number
}

export type RedditMediaMetadataSuccess = {
    status: 'valid',
    e: 'Image',
    m: string,
    p: GalleryData[],
    s: GalleryData,
    id: string
}

type RedditMediaMetadataFail = {
    status: 'failed'
} 

/** 
 * Properties all Reddit posts have in common.
 * If a property type is `unknown`, it needs to be updated if you can provide
 * a correct type!
 */
interface IRedditBase {
    approved_at_utc: null | number
    subreddit: string
    selftext: string
    /** Author's ID, not username */
    author_fullname: string
    saved: boolean
    mod_reason_title: unknown
    gilded: number
    clicked: boolean
    title: string
    link_flair_richtext: any[]
    subreddit_name_prefixed: string
    hidden: boolean
    pwls: number
    link_flair_css_class: unknown
    downs: number
    thumbnail_height: unknown
    top_awarded_type: unknown
    hide_score: boolean
    /** Post's ID */
    name: string
    quarantine: boolean
    link_flair_text_color: string
    upvote_ratio: number
    author_flair_background_color: unknown
    subreddit_type: 'public'
    ups: number
    total_awards_received: number
    media_embed: any
    thumbnail_width: null | number
    author_flair_template_id: unknown
    is_original_content: boolean
    user_reports: any[]
    secure_media: unknown
    is_reddit_media_domain: boolean
    is_meta: boolean
    category: unknown
    secure_media_embed: any
    link_flair_text: unknown
    can_mod_post: boolean
    score: number
    approved_by: unknown
    author_premium: boolean
    thumbnail: string
    edited: number
    author_flair_css_class: unknown
    author_flair_richtext: any[]
    gildings: any
    content_categories: unknown
    is_self: boolean
    mod_note: unknown
    created: number
    link_flair_type: string
    wls: number
    removed_by_category: unknown
    banned_by: unknown
    author_flair_type: string
    domain: string
    allow_live_comments: boolean
    selftext_html: string
    likes: unknown
    suggested_sort: string
    banned_at_utc: null | number
    view_count: null | number
    /** New posts cannot be archived */
    archived: false
    no_follow: boolean
    is_crosspostable: boolean
    pinned: boolean
    over_18: boolean
    all_awardings: unknown[]
    awarders: unknown[]
    media_only: boolean
    can_gild: boolean
    spoiler: boolean
    locked: boolean
    author_flair_text: null | string
    treatment_tags: unknown[]
    visited: boolean
    removed_by: unknown
    // will likely be null in every case because the bot isn't authorized
    num_reports: null
    distinguished: unknown
    subreddit_id: string
    mod_reason_by: unknown
    removal_reason: unknown
    link_flair_background_color: string
    id: string
    is_robot_indexable: boolean
    report_reasons: unknown
    author: string
    discussion_type: null | string
    num_comments: number
    send_replies: boolean
    whitelist_status: string
    contest_mode: boolean
    mod_reports: unknown[]
    author_patreon_flair: boolean
    author_flair_text_color: null | string
    permalink: string
    parent_whitelist_status: string
    stickied: boolean
    url: string
    subreddit_subscribers: number
    created_utc: number
    num_crossposts: number
    media: unknown
    is_video: boolean
}

interface IRedditGallery extends IRedditBase {
    is_gallery: true
    media_metadata: {
        [key: string]: RedditMediaMetadataFail | RedditMediaMetadataSuccess
    }
    gallery_data: {
        items: { media_id: string, id: number }[]
    }
}

interface IRedditIsVideo extends IRedditBase {
    secure_media: RedditVideo
    media: RedditVideo
    post_hint: 'hosted:video'
    preview: {
        images: RedditImagePreview[]
        enabled: boolean
    }
}

export interface IRedditGfycat extends IRedditBase {
    is_reddit_media_domain: false
    post_hint: 'link' | 'rich:video'
    domain: 'gfycat.com'
    is_video: false
    media_embed: {
        content: string
        width: number
        height: number
        scrolling: boolean
    }
    secure_media?: {
        type: 'gfycat.com'
        oembed: RedditOEmbed<'https://gfycat.com'>
    }
    media?: {
        type: 'gfycat.com'
        oembed: RedditOEmbed<'https://gfycat.com'>
    }
    preview: {
        reddit_video_preview: RedditVideo & { fallback_url: string }
        images: RedditImagePreview
    }
}

/**
 * https://www.reddit.com/r/redditdev/comments/l46y2l/check_if_post_is_a_crosspost/gknm508
 */
interface IRedditIsCrosspost extends IRedditBase {
    /** Parent's ID */
    crosspost_parent: string
    crosspost_parent_list: RedditData['data'][]
}

/**
 * Union type of every possible post
 */
export type RedditData = {
    data: IRedditGallery | IRedditIsVideo | IRedditGfycat | IRedditIsCrosspost
}