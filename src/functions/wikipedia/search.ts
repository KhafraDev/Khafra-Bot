import { defaultRequestOptions, routes } from '#khaf/functions/wikipedia/constants.js'
import { wikiSearchSchema } from '#khaf/functions/wikipedia/schema.js'
import assert from 'node:assert'
import { stringify } from 'node:querystring'
import { request } from 'undici'

/**
 * Search wikipedia using a given query. Returns an empty { pages: [...] } array if no results were found
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const search = async (query: string) => {
  const p = stringify({ q: query, limit: '10' })

  /** @link https://api.wikimedia.org/wiki/Documentation/Code_samples/Search_Wikipedia#Searching_for_Wikipedia_articles_using_Python */
  const { body } = await request(`${routes.wikimedia}${p}`, defaultRequestOptions)

  const json: unknown = await body.json()
  assert(wikiSearchSchema.is(json))

  return json
}
