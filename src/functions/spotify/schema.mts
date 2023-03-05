import { s } from '@sapphire/shapeshift'

export const tokenSchema = s.object({
  access_token: s.string,
  token_type: s.string,
  expires_in: s.number
})

export const searchSchema = s.object({
  tracks: s.object({
    href: s.string,
    items: s.object({
      album: s.object({
        album_type: s.string,
        artists: s.object({
          external_urls: s.record(s.string),
          href: s.string,
          id: s.string,
          name: s.string,
          type: s.string,
          uri: s.string
        }).ignore.array,
        available_markets: s.string.array,
        external_urls: s.record(s.string),
        href: s.string,
        id: s.string,
        images: s.object({
          height: s.number,
          width: s.number,
          url: s.string
        }).array,
        name: s.string,
        release_date: s.string,
        release_date_precision: s.string,
        total_tracks: s.number,
        type: s.string,
        uri: s.string
      }),
      artists: s.object({
        external_urls: s.record(s.string),
        href: s.string,
        id: s.string,
        name: s.string,
        type: s.string,
        uri: s.string
      }).array,
      available_markets: s.string.array,
      disc_number: s.number,
      duration_ms: s.number,
      explicit: s.boolean,
      external_ids: s.record(s.string),
      external_urls: s.record(s.string),
      href: s.string,
      id: s.string,
      is_local: s.boolean,
      name: s.string,
      popularity: s.number,
      preview_url: s.string,
      track_number: s.number,
      type: s.string,
      uri: s.string
    }).array,
    limit: s.number,
    next: s.string.nullable,
    offset: s.number,
    previous: s.string.nullable,
    total: s.number
  }).ignore
}).ignore
