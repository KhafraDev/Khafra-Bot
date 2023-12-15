import { s } from '@sapphire/shapeshift'

interface Env {
  DB: D1Database
}

interface BibleVerse {
  id: number
  book: string
  chapter: number
  verse: number
  content: string
}

const betweenSchema = s.object({
  book: s.string,
  chapter: s.number.int.greaterThanOrEqual(0).lessThan(200),
  verse1: s.number.int.greaterThanOrEqual(0).lessThan(200),
  verse2: s.number.int.greaterThanOrEqual(0).lessThan(200)
})

const verseSchema = s.object({
  book: s.string,
  chapter: s.number.int.greaterThanOrEqual(0).lessThan(200),
  verse: s.number.int.greaterThanOrEqual(0).lessThan(200)
})

export default {
  async fetch (
    request: Request,
    env: Env
  ): Promise<Response> {
    const { pathname, searchParams } = new URL(request.url)

    if (pathname === '/bible/random') {
      const result = await env.DB.prepare(
        'SELECT * FROM bible WHERE id = (ABS(RANDOM()) % (SELECT (SELECT MAX(id) FROM bible) + 1)) LIMIT 1;'
      ).first<BibleVerse>()

      return Response.json(result)
    } else if (pathname === '/bible/between') {
      if (!['book', 'chapter', 'verse1', 'verse2'].every((v) => searchParams.has(v))) {
        return Response.json({ error: 'missing one on more params' }, { status: 400 })
      }

      const params = {
        book: searchParams.get('book'),
        chapter: Number(searchParams.get('chapter')),
        verse1: Number(searchParams.get('verse1')),
        verse2: Number(searchParams.get('verse2'))
      }

      if (!betweenSchema.is(params)) {
        return Response.json({ error: 'invalid param' }, { status: 400 })
      }

      const { results = [] } = await env.DB
        .prepare('SELECT * FROM bible WHERE book = ? AND chapter = ? AND verse BETWEEN ? AND ? LIMIT 50;')
        .bind(params.book, params.chapter, params.verse1, params.verse2)
        .all<BibleVerse>()

      return Response.json(results)
    } else if (pathname === '/bible/verse') {
      if (!['book', 'chapter', 'verse'].every((v) => searchParams.has(v))) {
        return Response.json({ error: 'missing one on more params' }, { status: 400 })
      }

      const params = {
        book: searchParams.get('book'),
        chapter: Number(searchParams.get('chapter')),
        verse: Number(searchParams.get('verse'))
      }

      if (!verseSchema.is(params)) {
        return Response.json({ error: 'invalid param' }, { status: 400 })
      }

      const result = await env.DB
        .prepare('SELECT * FROM bible WHERE book = ? AND chapter = ? AND verse = ? LIMIT 1;')
        .bind(params.book, params.chapter, params.verse)
        .first<BibleVerse>()

      return Response.json(result)
    }

    return Response.json({ error: 'unknown route' }, { status: 400 })
  }
} satisfies ExportedHandler<Env>
