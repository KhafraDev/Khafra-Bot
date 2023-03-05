// Copyright (C) 2019 Zed <zedeus@pm.me>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { auth, routes } from '#khaf/functions/twitter/constants.mjs'
import { guestToken } from '#khaf/functions/twitter/schema.mjs'
import { hours, minutes } from '#khaf/utility/ms.mjs'
import { createDeferredPromise } from '#khaf/utility/util.mjs'
import { fetch } from 'undici'

export class Token {
  // https://github.com/zedeus/nitter/blob/36c72f98603e6387431224b3fb65ada765e9ab65/src/tokens.nim#L10
  #maxAge = hours(2) + minutes(55)

  // https://github.com/zedeus/nitter/blob/36c72f98603e6387431224b3fb65ada765e9ab65/src/tokens.nim#L9
  #maxLastUse = hours(1)

  #init = Date.now()
  #lastUse = Date.now()

  #token: string | null

  constructor () {
    this.#token = null
  }

  get expired (): boolean {
    const time = Date.now()
    return this.#init < time - this.#maxAge || this.#lastUse < time - this.#maxLastUse
  }

  get token (): Promise<string | null> {
    if (!this.expired && this.#token) {
      return Promise.resolve(this.#token)
    }

    const p = createDeferredPromise<string | null>()

    this.fetchToken()
      .then((token) => {
        this.#lastUse = Date.now()
        p.resolve(token)
      })
      .catch((err: Error) => p.reject(err))

    return p.promise
  }

  async fetchToken (): Promise<string | null> {
    if (!this.expired && this.#token) {
      return this.#token
    }

    for (let i = 0; i < 5; i++) {
      // Fetch will automatically decompress the response.
      const response = await fetch(routes.activate, {
        method: 'POST',
        headers: {
          authorization: auth,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'accept-encoding': 'gzip',
          'accept-language': 'en-US,en;q=0.5'
        }
      })

      const json = await response.json()

      if (!guestToken.is(json)) {
        continue
      }

      return json.guest_token
    }

    return null
  }
}
