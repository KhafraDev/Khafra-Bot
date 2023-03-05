import { s } from '@sapphire/shapeshift'

export const wikiSearchSchema = s.object({
  pages: s.object({
    id: s.number,
    key: s.string,
    title: s.string,
    excerpt: s.string,
    matched_title: s.string.nullable,
    description: s.string,
    thumbnail: s.object({
      mimetype: s.string,
      size: s.number.nullable,
      width: s.number,
      height: s.number,
      duration: s.number.nullable
    }).ignore.nullable
  }).ignore.array
})

export const wikiExtractSchema = s.object({
  batchcomplete: s.string,
  query: s.object({
    pages: s.record(
      s.object({
        pageid: s.number,
        ns: s.number,
        title: s.string,
        extract: s.string
      }).ignore
    ).optional
  })
}).ignore
