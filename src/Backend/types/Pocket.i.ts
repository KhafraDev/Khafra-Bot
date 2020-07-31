export type PocketArticle = {
    item_id: string,
    resolved_id: string, 
    given_url: string,   // url
    given_title: string, // might be empty
    favorite: number,
    status: number,
    time_added: string,
    time_updated: string,
    time_read: string,
    time_favorited: string,
    sort_id: number,
    resolved_title: string,
    resolved_url: string,
    excerpt: string,
    is_article: string,
    is_index: string,
    has_video: string,
    has_image: string,
    word_count: string,
    lang: string,
    time_to_read: number,
    top_image_url: string,
    domain_metadata: [Object],
    listen_duration_estimate: number
}

type PocketList = {
    [key: string]: PocketArticle 
}

export type PocketGetResults = {
    status: number,
    complete: number,
    list: PocketList[],
    error: string | null,
    search_meta: { search_type: string },
    since: number
}