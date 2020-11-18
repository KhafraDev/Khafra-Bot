export interface RedditNotFound {
    message: string;
    error: number;
}

export interface RedditChildren {
    kind: 't3';
    data: {
        approved_at_utc?: number;
        subreddit: string;
        selftext: string;
        author_fullname: string;
        saved: boolean;
        mod_reason_title?: string;
        gilded: 0 | 1;
        clicked: boolean;
        title: string;
        link_flair_richtext: [];
        subreddit_name_prefixed: string;
        hidden: boolean;
        pwls: number;
        link_flair_css_class?: string;
        downs: number;
        thumbnail_height: number;
        top_awarded_type?: string;
        hide_score: true;
        name: string;
        quarantine: boolean;
        link_flair_text_color: string;
        upvote_ratio: number;
        author_flair_background_color?: string;
        subreddit_type: string;
        ups: number;
        total_awards_received: number;
        media_embed: {};
        thumbnail_width: number;
        author_flair_template_id?: string;
        is_original_content: boolean;
        user_reports: [];
        secure_media?: string;
        is_reddit_media_domain: boolean;
        is_meta: boolean;
        category?: string;
        secure_media_embed: {};
        link_flair_text?: string;
        can_mod_post: boolean;
        score: number;
        approved_by?: string;
        author_premium: boolean;
        thumbnail: string;
        edited: boolean;
        author_flair_css_class?: string;
        author_flair_richtext: [];
        gildings: {};
        post_hint: string;
        content_categories?: string;
        is_self: boolean;
        mod_note?: string;
        created: number;
        link_flair_type: string;
        wls: number;
        removed_by_category?: string;
        banned_by?: string;
        author_flair_type: string;
        domain: string;
        allow_live_comments: boolean;
        selftext_html?: string;
        likes?: number;
        suggested_sort: string;
        banned_at_utc?: number;
        url_overridden_by_dest: string;
        view_count?: number;
        archived: boolean;
        no_follow: boolean;
        is_crosspostable: boolean;
        pinned: boolean;
        over_18: boolean;
        preview: {
            images: {
                source: {
                    url: string;
                    width: number;
                    height: number;
                };
                resolutions: {
                    url: string;
                    width: number;
                    height: number;
                }[];
                variants: {};
                id: string;
                enabled: boolean;
            };
        }[];
        all_awardings: [];
        awarders: string[];
        media_only: boolean;
        can_gild: true;
        spoiler: boolean;
        locked: boolean;
        author_flair_text?: string;
        treatment_tags: [];
        visited: boolean;
        removed_by?: string;
        num_reports?: number;
        distinguished?: string;
        subreddit_id: string;
        mod_reason_by?: string;
        removal_reason?: string;
        link_flair_background_color: string;
        id: string;
        is_robot_indexable: boolean;
        report_reasons?: string;
        author: string;
        discussion_type?: string;
        num_comments: number;
        send_replies: boolean;
        whitelist_status: string;
        contest_mode: boolean;
        mod_reports: string[];
        author_patreon_flair: boolean;
        author_flair_text_color?: string;
        permalink: string;
        parent_whitelist_status: string;
        stickied: boolean;
        url: string;
        subreddit_subscribers: number;
        created_utc: number;
        num_crossposts: number;
        media?: {
            oembed: {
                provider_url: string
                title: string
                html: string
                height: number
                width: number
                version: string
                provider_name: string
                type: string
            }
            type: string;
        }
        is_video: boolean;
    };
}

export interface RedditNew {
    kind: string;
    data: {
        modhash: string;
        dist: number;
        children: RedditChildren[]
    };
}