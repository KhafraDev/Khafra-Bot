import { routes } from '#khaf/functions/minecraft/constants.mjs'
import { nameToUUIDSchema } from '#khaf/functions/minecraft/schema.mjs'
import type { InferType } from '@sapphire/shapeshift'
import assert from 'node:assert'
import { request } from 'undici'

/**
 * @see https://wiki.vg/Mojang_API#Username_to_UUID
 */
export const usernameToUUID = async (username: string): Promise<InferType<typeof nameToUUIDSchema>> => {
  const url = new URL(username, routes.usernameToUUID)
  const { statusCode, body } = await request(url)

  if (statusCode === 204) {
    await body.dump()
    assert(false, 'Username doesn\'t exist.')
  }

  const json: unknown = await body.json()
  assert(nameToUUIDSchema.is(json), 'An error occurred on Mojang\'s end.')
  return json
}
