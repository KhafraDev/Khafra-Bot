import { routes } from '#khaf/functions/minecraft/constants.js'
import assert from 'node:assert'
import { request } from 'undici'
import { nameToUUIDSchema } from '#khaf/functions/minecraft/schema.js'
import type { InferType } from '@sapphire/shapeshift'

/**
 * @see https://wiki.vg/Mojang_API#Username_to_UUID
 */
export const usernameToUUID = async (username: string): Promise<InferType<typeof nameToUUIDSchema>> => {
  const url = new URL(username, routes.usernameToUUID)
  const { statusCode, body } = await request(url)

  if (statusCode === 204) {
    assert(false, 'Username doesn\'t exist.')
  }

  const json: unknown = await body.json()
  assert(nameToUUIDSchema.is(json), 'An error occurred on Mojang\'s end.')
  return json
}
