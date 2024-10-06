import { accessTokenSchema } from '#khaf/functions/reddit/schema.mjs'
import { createDeferredPromise } from '#khaf/utility/util.mjs'
import { InferType } from '@sapphire/shapeshift'
import { fetch } from 'undici'

type AccessToken = InferType<typeof accessTokenSchema>

export class Queue {
  #auth
  #accessToken: AccessToken | null = null
  #tokenTask: ReturnType<typeof createDeferredPromise<AccessToken>> | null = null

  constructor (username: string, password: string) {
    this.#auth = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
  }

  #isExpired () {
    return this.#accessToken == null || Date.now() >= this.#accessToken.expires_in
  }

  fetchToken () {
    if (this.#tokenTask || !this.#isExpired()) {
      return this.#tokenTask?.promise ?? Promise.reject(new Error('Token not fetched.'))
    }

    this.#tokenTask = createDeferredPromise()

    fetch('https://www.reddit.com/api/v1/access_token?grant_type=client_credentials', {
      headers: {
        Authorization: this.#auth
      },
      method: 'POST'
    })
      .then((r) => r.json())
      .then((body) => {
        this.#accessToken = accessTokenSchema.parse(body)
        this.#accessToken.expires_in = Date.now() + this.#accessToken.expires_in * 1000
        this.#tokenTask?.resolve(this.#accessToken)
      })

    return this.#tokenTask.promise
  }
}
