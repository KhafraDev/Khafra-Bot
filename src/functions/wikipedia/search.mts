import assert from 'node:assert'
import { stringify } from 'node:querystring'
import type { InferType } from '@sapphire/shapeshift'
import { request } from 'undici'
import { defaultRequestOptions, routes } from '#khaf/functions/wikipedia/constants.mjs'
import { wikiSearchSchema } from '#khaf/functions/wikipedia/schema.mjs'

/**
 * Search wikipedia using a given query. Returns an empty { pages: [...] } array if no results were found
 */
export const search = async (query: string): Promise<InferType<typeof wikiSearchSchema>> => {
  const p = stringify({ q: query, limit: '10' })

  /** @link https://api.wikimedia.org/wiki/Documentation/Code_samples/Search_Wikipedia#Searching_for_Wikipedia_articles_using_Python */
  const { body } = await request(`${routes.wikimedia}${p}`, defaultRequestOptions)

  const json: unknown = await body.json()
  assert(wikiSearchSchema.is(json))

  return json
}
