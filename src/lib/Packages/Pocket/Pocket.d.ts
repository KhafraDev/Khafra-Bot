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
    domain_metadata: unknown[]
    listen_duration_estimate: number
}

export type PocketGetResults = {
    status: number,
    complete: number,
    list: Record<string, PocketArticle>
    error: string | null,
    search_meta: { search_type: string },
    since: number
}

export type PocketAddResults = {
    item: {
        item_id: string,
        normal_url: string,
        resolved_id: string,
        extended_item_id: string,
        resolved_url: string,
        domain_id: string,
        origin_domain_id: string,
        response_code: string,
        mime_type: string,
        content_length: string,
        encoding: string,
        date_resolved: Date,
        date_published: Date,
        title: string,
        excerpt: string,
        word_count: string,
        innerdomain_redirect: string,
        login_required: string,
        has_image: string,
        has_video: string,
        is_index: string,
        is_article: string,
        used_fallback: string,
        lang: string,
        time_first_parsed: string,
        authors: Record<string, unknown[]>,
        top_image_url: string,
        resolved_normal_url: string,
        domain_metadata?: {
            name: string,
            logo: string,
            greyscale_logo: string
        },
        given_url: string
    },
    status: 1
}

export type PocketRateLimit = Record<string, number>

declare class Pocket {
    consumer_key: string | undefined;
    redirect_uri?: string;
    request_token?: string;
    access_token?: string;
    username?: string;
    constructor(user?: {
        request_token: string;
        access_token: string;
        username: string;
    });
    /**
     * Pocket Authentication:
     *
     * Step 2: Obtain a request token
     * @throws {Error} when status isn't 200
     */
    requestCode(): Promise<string | undefined>;
    /**
     * Authorization URL. User must authorize Khafra-Bot by clicking the link generated.
     * @throws {Error} if there is no request_token
     */
    get requestAuthorization(): string;
    accessToken(): Promise<string | undefined>;
    getList(): Promise<PocketGetResults>;
    add(url: string | import('url').URL, title?: string): Promise<PocketAddResults>;
    toObject(): {
        request_token: string | undefined;
        access_token: string | undefined;
        username: string | undefined;
    };
}
export { Pocket };
