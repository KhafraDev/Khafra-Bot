import assert from 'node:assert'
import { Buffer } from 'node:buffer'
import type { InferType } from '@sapphire/shapeshift'
import { request } from 'undici'
import { routes, type textures } from '#khaf/functions/minecraft/constants.mjs'
import { profileSchema, profileTextures } from '#khaf/functions/minecraft/schema.mjs'

type Profile = InferType<typeof profileSchema>

/**
 * @see https://wiki.vg/Mojang_API#UUID_to_Profile_and_Skin.2FCape
 */
export async function profile(uuid: string): Promise<Profile>
export async function profile(uuid: string, modifier: keyof typeof textures): Promise<string[]>
export async function profile(uuid: string, modifier?: keyof typeof textures): Promise<Profile | string[]> {
  const url = new URL(uuid, routes.profile)
  const { body, statusCode } = await request(url)

  if (statusCode !== 200) {
    await body.dump()
    assert(false, 'An unknown error occurred, sorry.')
  }

  const j: unknown = await body.json()
  assert(profileSchema.is(j), 'Incorrect response from Mojang.')

  if (modifier === undefined) {
    return j
  }

  const capes: string[] = []

  for (const { value } of j.properties) {
    const data: unknown = JSON.parse(Buffer.from(value, 'base64').toString())
    assert(profileTextures.is(data), 'Unknown texture.')
    const texture = data.textures[modifier]

    if (texture !== undefined) {
      capes.push(texture.url)
    }
  }

  return capes
}
