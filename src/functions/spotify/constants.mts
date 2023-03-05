import { Buffer } from 'node:buffer'
import { env } from 'node:process'

export const routes = {
  token: 'https://accounts.spotify.com/api/token',
  search: 'https://api.spotify.com/v1/search'
} as const

export const requestOptions = {
  token: {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.SPOTIFY_ID}:${env.SPOTIFY_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  search: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }
} as const
