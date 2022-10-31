import { Buffer } from 'node:buffer'
import { env } from 'node:process'
import { URL, URLSearchParams } from 'node:url'
import { request } from 'undici'
import type { SpotifyResult } from './types/Spotify'

interface Token {
    access_token: string
    token_type: string
    expires_in: number
    scope?: string
}

class Spotify {
  #id = env.SPOTIFY_ID
  #secret = env.SPOTIFY_SECRET

  #token: Token | null = null
  #expires_in: number | null = null

  async search (query: string): Promise<SpotifyResult> {
    const params = '?' + new URLSearchParams({
      type: 'track',
      limit: '10',
      q: encodeURIComponent(query)
    }).toString()

    const token = await this.getTokenHeader()
    const { body } = await request(new URL(params, 'https://api.spotify.com/v1/search'), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...token
      }
    })

    return await body.json() as SpotifyResult
  }

  async setToken (): Promise<void> {
    const params = new URLSearchParams({ grant_type: 'client_credentials' })

    const { body } = await request('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: params.toString(),
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.#id}:${this.#secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const j = await body.json() as Token
    this.#token = j
    this.#expires_in = Date.now() + j.expires_in * 1000 // in milliseconds
  }

  async getTokenHeader (): Promise<{ Authorization: string }> {
    if (!this.#token || !this.#token.access_token || this.expired) {
      await this.setToken()
    }

    return { Authorization: `Bearer ${this.#token!.access_token}` }
  }

  get expired(): boolean {
    return this.#token !== null && Date.now() >= this.#expires_in!
  }
}

export const spotify = new Spotify()
