import { type InferType, s } from '@sapphire/shapeshift'

const mediaMetadataSchema = s.union(
  s.object({
    x: s.number,
    y: s.number,
    u: s.string
  }),
  s.object({
    x: s.number,
    y: s.number,
    mp4: s.string
  })
)

const allAwardingsSchema = s.object({
  giver_coin_reward: s.unknown,
  subreddit_id: s.unknown,
  is_new: s.boolean,
  days_of_drop_extension: s.unknown.optional,
  coin_price: s.number,
  id: s.string,
  penny_donate: s.unknown,
  award_sub_type: s.string,
  coin_reward: s.number,
  icon_url: s.string.url(),
  days_of_premium: s.unknown,
  tiers_by_required_awardings: s.unknown,
  resized_icons: s.unknown.array,
  icon_width: s.number,
  static_icon_width: s.number,
  start_date: s.unknown,
  is_enabled: s.boolean,
  awardings_required_to_grant_benefits: s.unknown,
  description: s.string,
  end_date: s.unknown,
  sticky_duration_seconds: s.unknown,
  subreddit_coin_reward: s.number,
  count: s.number,
  static_icon_height: s.number,
  name: s.string,
  resized_static_icons: s.unknown.array,
  icon_format: s.union(s.null, s.string),
  icon_height: s.number,
  penny_price: s.union(s.null, s.number),
  award_type: s.string,
  static_icon_url: s.string.url()
}).array

const childSchema = s.array(s.object({
  kind: s.string,
  data: s.object({
    approved_at_utc: s.union(s.null, s.number),
    subreddit: s.string,
    selftext: s.string,
    author_fullname: s.string.optional,
    saved: s.boolean,
    mod_reason_title: s.union(s.null, s.string),
    gilded: s.number,
    clicked: s.boolean,
    title: s.string,
    link_flair_richtext: s.unknown.array,
    subreddit_name_prefixed: s.string,
    hidden: s.boolean,
    pwls: s.number.or(s.null),
    link_flair_css_class: s.union(s.null, s.string),
    downs: s.number,
    thumbnail_height: s.union(s.null, s.number),
    top_awarded_type: s.union(s.null, s.string),
    hide_score: s.boolean,
    name: s.string,
    quarantine: s.boolean,
    link_flair_text_color: s.union(s.null, s.string),
    upvote_ratio: s.number,
    author_flair_background_color: s.union(s.null, s.string),
    subreddit_type: s.string,
    ups: s.number,
    total_awards_received: s.number,
    media_embed: s.unknown,
    thumbnail_width: s.union(s.null, s.number),
    author_flair_template_id: s.union(s.null, s.string),
    is_original_content: s.boolean,
    user_reports: s.unknown.array,
    secure_media: s.unknown,
    is_reddit_media_domain: s.boolean,
    is_meta: s.boolean,
    category: s.union(s.null, s.string),
    secure_media_embed: s.unknown,
    link_flair_text: s.union(s.null, s.string),
    can_mod_post: s.boolean,
    score: s.number,
    approved_by: s.union(s.null, s.string),
    is_created_from_ads_ui: s.boolean,
    author_premium: s.boolean.optional,
    thumbnail: s.string,
    edited: s.union(s.boolean.false, s.number),
    author_flair_css_class: s.union(s.null, s.string),
    author_flair_richtext: s.object({
      a: s.string.optional,
      u: s.string.url().optional,
      e: s.string,
      t: s.string.optional
    }).array.or(s.null).optional,
    gildings: s.record(s.number),
    post_hint: s.string.optional,
    content_categories: s.unknown,
    is_self: s.boolean,
    mod_note: s.union(s.null, s.string),
    created: s.number,
    link_flair_type: s.string,
    wls: s.number.or(s.null),
    removed_by_category: s.union(s.null, s.string),
    banned_by: s.union(s.null, s.string),
    author_flair_type: s.string.optional,
    domain: s.string,
    allow_live_comments: s.boolean,
    selftext_html: s.union(s.null, s.string),
    likes: s.unknown,
    suggested_sort: s.unknown,
    banned_at_utc: s.union(s.null, s.number),
    url_overridden_by_dest: s.string.url().optional,
    view_count: s.union(s.null, s.number),
    archived: s.boolean,
    no_follow: s.boolean,
    is_crosspostable: s.boolean,
    pinned: s.boolean,
    over_18: s.boolean,
    preview: s.unknown.optional,
    all_awardings: allAwardingsSchema,
    awarders: s.unknown.array,
    media_only: s.boolean,
    can_gild: s.boolean,
    spoiler: s.boolean,
    locked: s.boolean,
    author_flair_text: s.union(s.null, s.string),
    treatment_tags: s.string.array,
    visited: s.boolean,
    removed_by: s.unknown,
    num_reports: s.union(s.null, s.number),
    distinguished: s.unknown,
    subreddit_id: s.string,
    author_is_blocked: s.boolean,
    mod_reason_by: s.unknown,
    removal_reason: s.union(s.null, s.string),
    link_flair_background_color: s.union(s.null, s.string),
    id: s.string,
    is_robot_indexable: s.boolean,
    report_reasons: s.unknown,
    author: s.string,
    discussion_type: s.unknown,
    num_comments: s.number,
    send_replies: s.boolean,
    whitelist_status: s.string.or(s.null),
    contest_mode: s.boolean,
    mod_reports: s.unknown.array,
    author_patreon_flair: s.boolean.optional,
    author_flair_text_color: s.union(s.null, s.string),
    permalink: s.string,
    parent_whitelist_status: s.string.or(s.null),
    stickied: s.boolean,
    url: s.string.url(),
    subreddit_subscribers: s.number,
    created_utc: s.number,
    num_crossposts: s.number,
    media: s.unknown,
    is_video: s.boolean,
    is_gallery: s.boolean.optional,
    gallery_data: s.object({
      items: s.object({
        media_id: s.string,
        id: s.number
      }).array
    }).optional,
    media_metadata: s.record(s.object({
      status: s.string,
      e: s.string,
      m: s.string,
      p: mediaMetadataSchema.array,
      s: mediaMetadataSchema,
      id: s.string
    })).optional
  })
}))

const listingSchema = s.object({
  kind: s.string,
  data: s.object({
    after: s.string.or(s.null),
    dist: s.number,
    modhash: s.string,
    geo_filter: s.union(s.null, s.string),
    children: childSchema,
    before: s.unknown.or(s.null)
  })
})

const errorSchema = s.object({
  reason: s.string,
  message: s.string,
  error: s.number
})

export const apiSchema = s.union(listingSchema, errorSchema)

export type Reddit = InferType<typeof listingSchema> | InferType<typeof errorSchema>
