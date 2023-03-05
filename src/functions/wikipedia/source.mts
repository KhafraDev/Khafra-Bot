import { defaultRequestOptions, routes } from '#khaf/functions/wikipedia/constants.mjs'
import { wikiExtractSchema } from '#khaf/functions/wikipedia/schema.mjs'
import type { InferType } from '@sapphire/shapeshift'
import assert from 'node:assert'
import { stringify } from 'node:querystring'
import { request } from 'undici'

/**
 * Using a pageid, get an article's summary
 */
export const extractArticleText = async (id: string): Promise<InferType<typeof wikiExtractSchema>> => {
  // https://en.wikipedia.org/w/api.php?action=query&exlimit=1&explaintext=1&exsectionformat=plain&prop=extracts&pageids=5710507&format=json
  const p = stringify({
    action: 'query',
    exlimit: 1,
    explaintext: 1,
    exsectionformat: 'plain',
    prop: 'extracts',
    pageids: id,
    format: 'json'
  })

  const u = `${routes.wikipedia}${p}`
  const { body } = await request(u, defaultRequestOptions)
  const json: unknown = await body.json()
  assert(wikiExtractSchema.is(json))

  return json
}
