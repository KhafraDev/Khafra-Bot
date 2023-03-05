import { requestOptions, routes } from '#khaf/functions/spotify/constants.mjs'
import { searchSchema, tokenSchema } from '#khaf/functions/spotify/schema.mjs'
import { seconds } from '#khaf/utility/ms.mjs'
import type { InferType } from '@sapphire/shapeshift'
import assert from 'node:assert'
import { stringify } from 'node:querystring'
import { request } from 'undici'

export const spotify = new class Spotify {
  #token: string | null = null
  #expires = 0

  /**
   * @see https://developer.spotify.com/documentation/web-api/reference/#/operations/search
   */
  async search (query: string, artist: string | null): Promise<InferType<typeof searchSchema>> {
    const params = '?' + stringify({
      type: 'track',
      limit: '10',
      q: encodeURIComponent((`track:${query} ` + (artist ? `artist:${artist}` : '')).trim())
    })

    const { body } = await request(new URL(params, routes.search), {
      headers: {
        ...requestOptions.search.headers,
        Authorization: `Bearer ${await this.refreshToken()}`
      }
    })

    const j: unknown = await body.json()
    assert(searchSchema.is(j))
    return j
  }

  /**
   * @see https://developer.spotify.com/documentation/general/guides/authorization/client-credentials/#request-authorization
   */
  async refreshToken (): Promise<string> {
    if (Date.now() < this.#expires) {
      assert(this.#token)
      return this.#token
    }

    const { body } = await request(routes.token, requestOptions.token)
    const j: unknown = await body.json()
    assert(tokenSchema.is(j))

    this.#token = j.access_token
    this.#expires = Date.now() + seconds(j.expires_in)

    return this.#token
  }
}
