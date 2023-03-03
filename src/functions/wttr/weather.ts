import { routes } from '#khaf/functions/wttr/constants.js'
import { weatherSchema } from '#khaf/functions/wttr/schema.js'
import type { InferType } from '@sapphire/shapeshift'
import assert from 'node:assert'
import { request } from 'undici'

export const weather = async (location: string): Promise<InferType<typeof weatherSchema>> => {
  location = encodeURIComponent(location)

  const { body } = await request(new URL(`${location}?0&format=j1`, routes.base))
  const json: unknown = await body.json()
  assert(weatherSchema.is(json))

  return json
}
