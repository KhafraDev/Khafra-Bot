import { routes } from '#khaf/functions/wttr/constants.mjs'
import assert from 'node:assert'
import { request } from 'undici'

export const timezone = async (location: string): Promise<string> => {
  location = encodeURIComponent(location)

  const { statusCode, body } = await request(new URL(`${location}?format=%Z`, routes.base))

  assert(statusCode === 200)
  return await body.text()
}
