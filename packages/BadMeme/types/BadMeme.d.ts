export interface Reddit {
    kind?:    RedditKind;
    data?:    RedditData;
    message?: string;
    error?:   number;
    reason?:  string;
}

export interface RedditData {
    after:      null | string;
    dist:       number;
    modhash:    string;
    geo_filter: null;
    children:   Child[];
    before:     null;
}

export interface Child {
    kind: ChildKind;
    data: ChildData;
}

export interface ChildData {
    approved_at_utc:               null;
    subreddit:                     string;
    selftext:                      string;
    author_fullname?:              string;
    saved:                         boolean;
    mod_reason_title:              null;
    gilded:                        number;
    clicked:                       boolean;
    title:                         string;
    link_flair_richtext:           FlairRichtext[];
    subreddit_name_prefixed:       string;
    hidden:                        boolean;
    pwls:                          number | null;
    link_flair_css_class:          null | string;
    downs:                         number;
    thumbnail_height?:             number | null;
    top_awarded_type:              TopAwardedType | null;
    hide_score:                    boolean;
    name:                          string;
    quarantine:                    boolean;
    link_flair_text_color:         FlairTextColor;
    upvote_ratio:                  number;
    author_flair_background_color: `#${string}` | null;
    ups:                           number;
    total_awards_received:         number;
    media_embed:                   MediaEmbed;
    thumbnail_width?:              number | null;
    author_flair_template_id:      null | string;
    is_original_content:           boolean;
    user_reports:                  any[];
    secure_media:                  Media | null;
    is_reddit_media_domain:        boolean;
    is_meta:                       boolean;
    category:                      null | string;
    secure_media_embed:            MediaEmbed;
    link_flair_text:               null | string;
    can_mod_post:                  boolean;
    score:                         number;
    approved_by:                   null;
    is_created_from_ads_ui:        boolean;
    author_premium?:               boolean;
    thumbnail:                     string;
    edited:                        boolean | number;
    author_flair_css_class:        null | string;
    author_flair_richtext?:        FlairRichtext[];
    gildings:                      Gildings;
    post_hint?:                    PostHint;
    content_categories:            ContentCategory[] | null;
    is_self:                       boolean;
    subreddit_type:                SubredditType;
    created:                       number;
    link_flair_type:               FlairType;
    wls:                           number | null;
    removed_by_category:           null;
    banned_by:                     null;
    author_flair_type?:            FlairType;
    domain:                        string;
    allow_live_comments:           boolean;
    selftext_html:                 null | string;
    likes:                         null;
    suggested_sort:                SuggestedSort | null;
    banned_at_utc:                 null;
    url_overridden_by_dest?:       string;
    view_count:                    null;
    archived:                      boolean;
    no_follow:                     boolean;
    is_crosspostable:              boolean;
    pinned:                        boolean;
    over_18:                       boolean;
    preview?:                      Preview;
    all_awardings:                 DataAllAwarding[];
    awarders:                      any[];
    media_only:                    boolean;
    link_flair_template_id?:       string;
    can_gild:                      boolean;
    spoiler:                       boolean;
    locked:                        boolean;
    author_flair_text:             null | string;
    treatment_tags:                any[];
    visited:                       boolean;
    removed_by:                    null;
    mod_note:                      null;
    distinguished:                 Distinguished | null;
    subreddit_id:                  string;
    author_is_blocked:             boolean;
    mod_reason_by:                 null;
    num_reports:                   null;
    removal_reason:                null;
    link_flair_background_color:   string;
    id:                            string;
    is_robot_indexable:            boolean;
    report_reasons:                null;
    author:                        string;
    discussion_type:               null;
    num_comments:                  number;
    send_replies:                  boolean;
    whitelist_status:              WhitelistStatus | null;
    contest_mode:                  boolean;
    mod_reports:                   any[];
    author_patreon_flair?:         boolean;
    author_flair_text_color:       FlairTextColor | null;
    permalink:                     string;
    parent_whitelist_status:       WhitelistStatus | null;
    stickied:                      boolean;
    url:                           string;
    subreddit_subscribers:         number;
    created_utc:                   number;
    num_crossposts:                number;
    media:                         Media | null;
    is_video:                      boolean;
    is_gallery?:                   boolean;
    media_metadata?:               MediaMetadata;
    gallery_data?:                 DataGalleryData;
    author_cakeday?:               boolean;
    crosspost_parent_list?:        CrosspostParentList[];
    crosspost_parent?:             string;
    poll_data?:                    PollData;
}

export interface DataAllAwarding {
    giver_coin_reward:                    number | null;
    subreddit_id:                         null | string;
    is_new:                               boolean;
    days_of_drip_extension:               number;
    coin_price:                           number;
    id:                                   string;
    penny_donate:                         number | null;
    award_sub_type:                       AwardSubType;
    coin_reward:                          number;
    icon_url:                             string;
    days_of_premium:                      number;
    tiers_by_required_awardings:          { [key: string]: TiersByRequiredAwarding } | null;
    resized_icons:                        ResizedIcon[];
    icon_width:                           number;
    static_icon_width:                    number;
    start_date:                           number | null;
    is_enabled:                           boolean;
    awardings_required_to_grant_benefits: number | null;
    description:                          string;
    end_date:                             null;
    subreddit_coin_reward:                number;
    count:                                number;
    static_icon_height:                   number;
    name:                                 string;
    resized_static_icons:                 ResizedIcon[];
    icon_format:                          Format | null;
    icon_height:                          number;
    penny_price:                          number | null;
    award_type:                           AwardType;
    static_icon_url:                      string;
}

export enum AwardSubType {
    Appreciation = "APPRECIATION",
    Community = "COMMUNITY",
    Global = "GLOBAL",
    Group = "GROUP",
    Premium = "PREMIUM",
}

export enum AwardType {
    Community = "community",
    Global = "global",
}

export enum Format {
    Apng = "APNG",
    PNG = "PNG",
}

export interface ResizedIcon {
    url:     string;
    width:   number;
    height:  number;
    format?: Format | null;
}

export interface TiersByRequiredAwarding {
    resized_icons:        ResizedIcon[];
    awardings_required:   number;
    static_icon:          ResizedIcon;
    resized_static_icons: ResizedIcon[];
    icon:                 ResizedIcon;
}

export interface FlairRichtext {
    a?: string;
    e:  AuthorFlairRichtextE;
    u?: string;
    t?: string;
}

export enum AuthorFlairRichtextE {
    Emoji = "emoji",
    Text = "text",
}

export enum FlairTextColor {
    Dark = "dark",
    Empty = "",
    Light = "light",
}

export enum FlairType {
    Richtext = "richtext",
    Text = "text",
}

export enum ContentCategory {
    Comics = "comics",
    DrawingAndPainting = "drawing_and_painting",
    Entertainment = "entertainment",
    Photography = "photography",
}

export interface CrosspostParentList {
    approved_at_utc:               null;
    subreddit:                     string;
    selftext:                      string;
    author_fullname?:              string;
    saved:                         boolean;
    mod_reason_title:              null;
    gilded:                        number;
    clicked:                       boolean;
    title:                         string;
    link_flair_richtext:           FlairRichtext[];
    subreddit_name_prefixed:       string;
    hidden:                        boolean;
    pwls:                          number | null;
    link_flair_css_class:          null | string;
    downs:                         number;
    thumbnail_height?:             number;
    top_awarded_type:              TopAwardedType | null;
    hide_score:                    boolean;
    name:                          string;
    quarantine:                    boolean;
    link_flair_text_color:         FlairTextColor;
    upvote_ratio:                  number;
    author_flair_background_color: null | string;
    subreddit_type:                SubredditType;
    ups:                           number;
    total_awards_received:         number;
    media_embed:                   MediaEmbed;
    thumbnail_width?:              number;
    author_flair_template_id:      null | string;
    is_original_content:           boolean;
    user_reports:                  any[];
    secure_media:                  Media | null;
    is_reddit_media_domain:        boolean;
    is_meta:                       boolean;
    category:                      null;
    secure_media_embed:            MediaEmbed;
    link_flair_text:               null | string;
    can_mod_post:                  boolean;
    score:                         number;
    approved_by:                   null;
    is_created_from_ads_ui:        boolean;
    author_premium?:               boolean;
    thumbnail:                     string;
    edited:                        boolean;
    author_flair_css_class:        null;
    author_flair_richtext?:        FlairRichtext[];
    gildings:                      Gildings;
    post_hint?:                    PostHint;
    content_categories:            ContentCategory[] | null;
    is_self:                       boolean;
    mod_note:                      null;
    created:                       number;
    link_flair_type:               FlairType;
    wls:                           number | null;
    removed_by_category:           Distinguished | null;
    banned_by:                     null;
    author_flair_type?:            FlairType;
    domain:                        Domain;
    allow_live_comments:           boolean;
    selftext_html:                 null | string;
    likes:                         null;
    suggested_sort:                SuggestedSort | null;
    banned_at_utc:                 null;
    url_overridden_by_dest?:       string;
    view_count:                    null;
    archived:                      boolean;
    no_follow:                     boolean;
    is_crosspostable:              boolean;
    pinned:                        boolean;
    over_18:                       boolean;
    preview?:                      Preview;
    all_awardings:                 CrosspostParentListAllAwarding[];
    awarders:                      any[];
    media_only:                    boolean;
    can_gild:                      boolean;
    spoiler:                       boolean;
    locked:                        boolean;
    author_flair_text:             null | string;
    treatment_tags:                any[];
    visited:                       boolean;
    removed_by:                    null;
    num_reports:                   null;
    distinguished:                 null;
    subreddit_id:                  string;
    author_is_blocked:             boolean;
    mod_reason_by:                 null;
    removal_reason:                null;
    link_flair_background_color:   string;
    id:                            string;
    is_robot_indexable:            boolean;
    report_reasons:                null;
    author:                        string;
    discussion_type:               null;
    num_comments:                  number;
    send_replies:                  boolean;
    whitelist_status:              WhitelistStatus | null;
    contest_mode:                  boolean;
    mod_reports:                   any[];
    author_patreon_flair?:         boolean;
    author_flair_text_color:       FlairTextColor | null;
    permalink:                     string;
    parent_whitelist_status:       WhitelistStatus | null;
    stickied:                      boolean;
    url:                           string;
    subreddit_subscribers:         number;
    created_utc:                   number;
    num_crossposts:                number;
    media:                         Media | null;
    is_video:                      boolean;
    link_flair_template_id?:       string;
    is_gallery?:                   boolean;
    media_metadata?:               { [key: string]: GalleryItem } | null;
    gallery_data?:                 CrosspostParentListGalleryData | null;
}

export interface CrosspostParentListAllAwarding {
    giver_coin_reward:                    number | null;
    subreddit_id:                         null | string;
    is_new:                               boolean;
    days_of_drip_extension:               number;
    coin_price:                           number;
    id:                                   string;
    penny_donate:                         number | null;
    award_sub_type:                       AwardSubType;
    coin_reward:                          number;
    icon_url:                             string;
    days_of_premium:                      number;
    tiers_by_required_awardings:          { [key: string]: TiersByRequiredAwarding } | null;
    resized_icons:                        ResizedIcon[];
    icon_width:                           number;
    static_icon_width:                    number;
    start_date:                           null;
    is_enabled:                           boolean;
    awardings_required_to_grant_benefits: number | null;
    description:                          string;
    end_date:                             null;
    subreddit_coin_reward:                number;
    count:                                number;
    static_icon_height:                   number;
    name:                                 string;
    resized_static_icons:                 ResizedIcon[];
    icon_format:                          Format | null;
    icon_height:                          number;
    penny_price:                          number | null;
    award_type:                           AwardType;
    static_icon_url:                      string;
}

export enum Domain {
    GfycatCOM = "gfycat.com",
    IImgurCOM = "i.imgur.com",
    IReddIt = "i.redd.it",
    RedditCOM = "reddit.com",
    SelfPiratedGames = "self.PiratedGames",
    VReddIt = "v.redd.it",
    VirginiamercuryCOM = "virginiamercury.com",
    WsjCOM = "wsj.com",
}

export interface CrosspostParentListGalleryData {
    items: PurpleItem[];
}

export interface PurpleItem {
    media_id: string;
    id:       number;
}

export interface Gildings {
    gid_1?: number;
    gid_2?: number;
    gid_3?: number;
}

export interface Media {
    reddit_video?: RedditVideo;
    oembed?:       Oembed;
    type?:         MediaType;
}

export interface Oembed {
    provider_url:      string;
    description?:      string;
    title?:            string;
    author_name?:      string;
    height:            number | null;
    width:             number;
    html:              string;
    thumbnail_width?:  number;
    version:           string;
    provider_name:     ProviderName;
    thumbnail_url?:    string;
    type:              OembedType;
    thumbnail_height?: number;
    author_url?:       string;
    url?:              string;
    cache_age?:        number;
}

export enum ProviderName {
    Gfycat = "Gfycat",
    Imgur = "Imgur",
    RedGIFS = "RedGIFs",
    Streamable = "Streamable",
    Twitter = "Twitter",
    Vimeo = "Vimeo",
    YouTube = "YouTube",
}

export enum OembedType {
    Rich = "rich",
    Video = "video",
}

export interface RedditVideo {
    bitrate_kbps:       number;
    fallback_url:       string;
    height:             number;
    width:              number;
    scrubber_media_url: string;
    dash_url:           string;
    duration:           number;
    hls_url:            string;
    is_gif:             boolean;
    transcoding_status: TranscodingStatus;
}

export enum TranscodingStatus {
    Completed = "completed",
}

export enum MediaType {
    GfycatCOM = "gfycat.com",
    ImgurCOM = "imgur.com",
    MYoutubeCOM = "m.youtube.com",
    RedgifsCOM = "redgifs.com",
    StreamableCOM = "streamable.com",
    TwitterCOM = "twitter.com",
    VimeoCOM = "vimeo.com",
    YoutubeCOM = "youtube.com",
}

export interface MediaEmbed {
    content?:          string;
    width?:            number;
    scrolling?:        boolean;
    height?:           number;
    media_domain_url?: string;
}

export interface GalleryItem {
    status: Status;
    e:      MediaTypeEnum;
    m:      M;
    p:      SElement[];
    s:      SElement | GalleryGifOrMp4;
    id:     string;
    o?:     SElement[];
}

export enum MediaTypeEnum {
    Image = "Image",
}

export enum M {
    ImageJpg = "image/jpg",
    ImagePNG = "image/png",
}

export interface SElement {
    y: number;
    x: number;
    u: string;
}

export enum Status {
    Valid = "valid",
    Invalid = "invalid",
}

export enum WhitelistStatus {
    AllAds = "all_ads",
    NoAds = "no_ads",
    PromoAdultNsfw = "promo_adult_nsfw",
    SomeAds = "some_ads",
}

export enum PostHint {
    HostedVideo = "hosted:video",
    Image = "image",
    Link = "link",
    RichVideo = "rich:video",
    Self = "self",
}

export interface Preview {
    images:                Image[];
    enabled:               boolean;
    reddit_video_preview?: RedditVideo;
}

export interface Image {
    source:      ResizedIcon;
    resolutions: ResizedIcon[];
    variants:    Variants;
    id:          string;
}

export interface Variants {
    obfuscated?: GIF;
    nsfw?:       GIF;
    gif?:        GIF;
    mp4?:        GIF;
}

export interface GIF {
    source:      ResizedIcon;
    resolutions: ResizedIcon[];
}

export enum Distinguished {
    Deleted = "deleted",
    Moderator = "moderator",
    Reddit = "reddit",
}

export enum SubredditType {
    Public = "public",
}

export enum SuggestedSort {
    Confidence = "confidence",
    New = "new",
    Top = "top",
}

export enum TopAwardedType {
    Active = "ACTIVE",
    Inactive = "INACTIVE",
}

export interface DataGalleryData {
    items: FluffyItem[];
}

export interface FluffyItem {
    media_id:      string;
    id:            number;
    outbound_url?: string;
    caption?:      string;
}

export interface MediaMetadata {
    [key: string]: GalleryItem
}

export interface GalleryGifOrMp4 {
    y:   number;
    gif: string;
    mp4: string;
    x:   number;
}

export interface PollData {
    prediction_status:     null;
    total_stake_amount:    null;
    voting_end_timestamp:  number;
    options:               Option[];
    vote_updates_remained: null;
    is_prediction:         boolean;
    resolved_option_id:    null;
    user_won_amount:       null;
    user_selection:        null;
    total_vote_count:      number;
    tournament_id:         null;
}

export interface Option {
    text: string;
    id:   string;
}

export enum ChildKind {
    T3 = "t3",
}

export enum RedditKind {
    Listing = "Listing",
}
