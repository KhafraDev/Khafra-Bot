import { z } from 'zod'

const mediaMetadataSchema = z.union([
  z.object({
    x: z.number(),
    y: z.number(),
    u: z.string()
  }),
  z.object({
    x: z.number(),
    y: z.number(),
    mp4: z.string()
  })
])

const allAwardingsSchema = z.object({
  giver_coin_reward: z.unknown(),
  subreddit_id: z.unknown(),
  is_new: z.boolean(),
  days_of_drop_extension: z.unknown().optional(),
  coin_price: z.number(),
  id: z.string(),
  penny_donate: z.unknown(),
  award_sub_type: z.string(),
  coin_reward: z.number(),
  icon_url: z.string().url(),
  days_of_premium: z.unknown(),
  tiers_by_required_awardings: z.unknown(),
  resized_icons: z.unknown().array(),
  icon_width: z.number(),
  static_icon_width: z.number(),
  start_date: z.unknown(),
  is_enabled: z.boolean(),
  awardings_required_to_grant_benefits: z.unknown(),
  description: z.string(),
  end_date: z.unknown(),
  sticky_duration_seconds: z.unknown(),
  subreddit_coin_reward: z.number(),
  count: z.number(),
  static_icon_height: z.number(),
  name: z.string(),
  resized_static_icons: z.unknown().array(),
  icon_format: z.string().nullable(),
  icon_height: z.number(),
  penny_price: z.number().nullable(),
  award_type: z.string(),
  static_icon_url: z.string().url()
}).array()

const childSchema = z.array(z.object({
  kind: z.string(),
  data: z.object({
    approved_at_utc: z.number().nullable(),
    subreddit: z.string(),
    selftext: z.string(),
    author_fullname: z.string().optional(),
    saved: z.boolean(),
    mod_reason_title: z.string().nullable(),
    gilded: z.number(),
    clicked: z.boolean(),
    title: z.string(),
    link_flair_richtext: z.unknown().array(),
    subreddit_name_prefixed: z.string(),
    hidden: z.boolean(),
    pwls: z.number().nullable(),
    link_flair_css_class: z.string().nullable(),
    downs: z.number(),
    thumbnail_height: z.number().nullable(),
    top_awarded_type: z.string().nullable(),
    hide_score: z.boolean(),
    name: z.string(),
    quarantine: z.boolean(),
    link_flair_text_color: z.string().nullable(),
    upvote_ratio: z.number(),
    author_flair_background_color: z.string().nullable(),
    subreddit_type: z.string(),
    ups: z.number(),
    total_awards_received: z.number(),
    media_embed: z.unknown(),
    thumbnail_width: z.number().nullable(),
    author_flair_template_id: z.string().nullable(),
    is_original_content: z.boolean(),
    user_reports: z.unknown().array(),
    secure_media: z.unknown(),
    is_reddit_media_domain: z.boolean(),
    is_meta: z.boolean(),
    category: z.string().nullable(),
    secure_media_embed: z.unknown(),
    link_flair_text: z.string().nullable(),
    can_mod_post: z.boolean(),
    score: z.number(),
    approved_by: z.string().nullable(),
    is_created_from_ads_ui: z.boolean(),
    author_premium: z.boolean().optional(),
    thumbnail: z.string(),
    edited: z.union([z.literal(false), z.number()]),
    author_flair_css_class: z.string().nullable(),
    author_flair_richtext: z.object({
      a: z.string().optional(),
      u: z.string().url().optional(),
      e: z.string(),
      t: z.string().optional()
    }).array().nullable().optional(),
    gildings: z.record(z.number()),
    post_hint: z.string().optional(),
    content_categories: z.unknown(),
    is_self: z.boolean(),
    mod_note: z.string().nullable(),
    created: z.number(),
    link_flair_type: z.string(),
    wls: z.number().nullable(),
    removed_by_category: z.string().nullable(),
    banned_by: z.string().nullable(),
    author_flair_type: z.string().optional(),
    domain: z.string(),
    allow_live_comments: z.boolean(),
    selftext_html: z.string().nullable(),
    likes: z.unknown(),
    suggested_sort: z.unknown(),
    banned_at_utc: z.number().nullable(),
    url_overridden_by_dest: z.string().url().optional(),
    view_count: z.number().nullable(),
    archived: z.boolean(),
    no_follow: z.boolean(),
    is_crosspostable: z.boolean(),
    pinned: z.boolean(),
    over_18: z.boolean(),
    preview: z.unknown().optional(),
    all_awardings: allAwardingsSchema,
    awarders: z.unknown().array(),
    media_only: z.boolean(),
    can_gild: z.boolean(),
    spoiler: z.boolean(),
    locked: z.boolean(),
    author_flair_text: z.string().nullable(),
    treatment_tags: z.string().array(),
    visited: z.boolean(),
    removed_by: z.unknown(),
    num_reports: z.number().nullable(),
    distinguished: z.unknown(),
    subreddit_id: z.string(),
    author_is_blocked: z.boolean(),
    mod_reason_by: z.unknown(),
    removal_reason: z.string().nullable(),
    link_flair_background_color: z.string().nullable(),
    id: z.string(),
    is_robot_indexable: z.boolean(),
    report_reasons: z.unknown(),
    author: z.string(),
    discussion_type: z.unknown(),
    num_comments: z.number(),
    send_replies: z.boolean(),
    whitelist_status: z.string().nullable().optional(),
    contest_mode: z.boolean(),
    mod_reports: z.unknown().array(),
    author_patreon_flair: z.boolean().optional(),
    author_flair_text_color: z.string().nullable(),
    permalink: z.string(),
    parent_whitelist_status: z.string().nullable().optional(),
    stickied: z.boolean(),
    url: z.string().url(),
    subreddit_subscribers: z.number(),
    created_utc: z.number(),
    num_crossposts: z.number(),
    media: z.unknown(),
    is_video: z.boolean(),
    is_gallery: z.boolean().optional(),
    gallery_data: z.object({
      items: z.object({
        media_id: z.string(),
        id: z.number()
      }).array()
    }).optional(),
    media_metadata: z.record(z.object({
      status: z.string(),
      e: z.string(),
      m: z.string(),
      p: mediaMetadataSchema.array(),
      s: mediaMetadataSchema,
      id: z.string()
    })).optional()
  })
}))

const listingSchema = z.object({
  kind: z.string(),
  data: z.object({
    after: z.string().nullable(),
    dist: z.number(),
    modhash: z.string(),
    geo_filter: z.string().nullable(),
    children: childSchema,
    before: z.unknown().nullable()
  })
})

const errorSchema = z.object({
  reason: z.string(),
  message: z.string(),
  error: z.number()
})

export const apiSchema = z.union([listingSchema, errorSchema])

export type Reddit = z.infer<typeof listingSchema> | z.infer<typeof errorSchema>

export const accessTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  scope: z.string()
})
