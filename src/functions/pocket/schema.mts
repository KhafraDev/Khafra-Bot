import { s } from '@sapphire/shapeshift'

export const oauthSchema = s.object({ code: s.string })

export const oauthAuthSchema = s.object({
  access_token: s.string,
  username: s.string
})

/**
 * @see https://getpocket.com/developer/docs/v3/add
 */
export const addSchema = s.object({
  item: s.object({
    item_id: s.string,
    normal_url: s.string,
    resolved_id: s.string,
    extended_item_id: s.string,
    resolved_url: s.string,
    domain_id: s.string,
    origin_domain_id: s.string,
    response_code: s.string,
    mime_type: s.string,
    content_length: s.string,
    encoding: s.string,
    date_resolved: s.string,
    date_published: s.string,
    title: s.string,
    excerpt: s.string.nullable,
    word_count: s.string,
    innerdomain_redirect: s.string,
    login_required: s.string,
    has_image: s.string,
    has_video: s.string,
    is_index: s.string,
    is_article: s.string,
    used_fallback: s.string,
    lang: s.string,
    time_first_parsed: s.string,
    authors: s.unknown,
    images: s.unknown,
    videos: s.unknown.array,
    amp_url: s.string,
    top_image_url: s.string,
    resolved_normal_url: s.string,
    domain_metadata: s.object({
      name: s.string.nullable.optional,
      logo: s.string.nullable.optional,
      greyscale_logo: s.string.nullable.optional
    }).nullable.optional,
    time_to_read: s.number,
    given_url: s.string
  }),
  status: s.number
})

/**
 * @see https://getpocket.com/developer/docs/v3/retrieve
 */
export const retrieveSchema = s.object({
  list: s.record(
    s.object({
      item_id: s.string,
      resolved_id: s.string,
      given_url: s.string,
      given_title: s.string,
      favorite: s.string,
      status: s.string,
      time_added: s.string,
      time_updated: s.string,
      time_read: s.string,
      time_favorited: s.string,
      sort_id: s.number,
      resolved_title: s.string,
      resolved_url: s.string,
      excerpt: s.string,
      is_article: s.string,
      is_index: s.string,
      has_video: s.string,
      has_image: s.string,
      word_count: s.string,
      lang: s.string,
      time_to_read: s.number,
      top_image_url: s.string,
      domain_metadata: s.object({
        name: s.string.nullable.optional,
        logo: s.string.nullable.optional,
        greyscale_logo: s.string.nullable.optional
      }).nullable.optional,
      listen_duration_estimate: s.number
    })
  ),
  status: s.number
})
