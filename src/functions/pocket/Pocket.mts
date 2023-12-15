import { addSchema, oauthAuthSchema, oauthSchema, retrieveSchema } from '#khaf/functions/pocket/schema.mjs'
import type { InferType } from '@sapphire/shapeshift'
import assert from 'node:assert'
import { env } from 'node:process'
import { type Dispatcher, request } from 'undici'

const limits = {
  'x-limit-user-limit': -1, // Current rate limit enforced per user
  'x-limit-user-remaining': -1, // Number of calls remaining before hitting user's rate limit
  'x-limit-user-reset': -1, // Seconds until user's rate limit resets
  'x-limit-key-limit': -1, // Current rate limit enforced per consumer key
  'x-limit-key-remaining': -1, // Number of calls remaining before hitting consumer key's rate limit
  'x-limit-key-reset': -1 // Seconds until consumer key rate limit resets
} satisfies Record<string, number>

export class Pocket {
  redirect_uri?: string
  requestToken?: string
  accessToken?: string
  username?: string

  constructor (user?: { request_token: string; access_token: string; username: string }) {
    if (user) {
      this.requestToken = user.request_token
      this.accessToken = user.access_token
      this.username = user.username
    }
  }

  /**
   * Step 2 Obtain a request token
   */
  async requestCode (): Promise<string> {
    assert(!isRateLimited())

    const { body, headers, statusCode } = await request('https://getpocket.com/v3/oauth/request', {
      method: 'POST',
      headers: {
        Host: 'getpocket.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Accept': 'application/json'
      },
      body: JSON.stringify({
        consumer_key: env.POCKET_CONSUMER_KEY,
        redirect_uri: this.redirect_uri
      })
    })

    setRateLimits(headers)
    assert(statusCode === 200)

    const json: unknown = await body.json()
    assert(oauthSchema.is(json))

    this.requestToken = json.code
    return this.requestToken
  }

  /**
   * Authorization URL. User must authorize Khafra-Bot by clicking the link generated.
   */
  get requestAuthorization (): string {
    assert(this.requestToken && this.redirect_uri)

    return `https://getpocket.com/auth/authorize?request_token=${this.requestToken}&redirect_uri=${this.redirect_uri}`
  }

  async getAccessToken (): Promise<string> {
    assert(!isRateLimited())

    const { body, headers, statusCode } = await request('https://getpocket.com/v3/oauth/authorize', {
      method: 'POST',
      headers: {
        Host: 'getpocket.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Accept': 'application/json'
      },
      body: JSON.stringify({
        consumer_key: env.POCKET_CONSUMER_KEY,
        code: this.requestToken
      })
    })

    setRateLimits(headers)
    assert(statusCode === 200)

    const json: unknown = await body.json()
    assert(oauthAuthSchema.is(json))

    this.accessToken = json.access_token
    this.username = json.username
    return this.accessToken
  }

  async getList (): Promise<InferType<typeof retrieveSchema>> {
    assert(!isRateLimited())

    const { body, headers, statusCode } = await request('https://getpocket.com/v3/get', {
      method: 'POST',
      headers: {
        Host: 'getpocket.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        consumer_key: env.POCKET_CONSUMER_KEY,
        access_token: this.accessToken,
        contentType: 'article',
        detailType: 'simple',
        sort: 'newest',
        count: 10
      })
    })

    setRateLimits(headers)
    assert(statusCode === 200)

    const j: unknown = await body.json()
    assert(retrieveSchema.is(j))

    return j
  }

  async add (url: string | URL, title?: string): Promise<InferType<typeof addSchema>> {
    assert(!isRateLimited())

    const { body, headers, statusCode } = await request('https://getpocket.com/v3/add', {
      method: 'POST',
      headers: {
        Host: 'getpocket.com',
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Accept': 'application/json'
      },
      body: JSON.stringify({
        url: `${url}`,
        title,
        time: Date.now(),
        consumer_key: env.POCKET_CONSUMER_KEY,
        access_token: this.accessToken
      })
    })

    setRateLimits(headers)
    assert(statusCode === 200)

    const j: unknown = await body.json()
    assert(addSchema.is(j))

    return j
  }
}

const setRateLimits = (headers: Dispatcher.ResponseData['headers']): void => {
  const keys = new Set(Object.keys(limits))

  for (const headerName of Object.keys(headers)) {
    const lowercase = headerName.toLowerCase() as keyof typeof limits

    if (keys.has(lowercase)) {
      limits[lowercase] = Number(headers[headerName])
      assert(!Number.isNaN(limits[lowercase]))
    }
  }
}

const isRateLimited = (): boolean => !limits['x-limit-key-remaining'] || !limits['x-limit-user-remaining']
