import { routes, type textures } from '#khaf/functions/minecraft/constants.js'
import { profileSchema, profileTextures } from '#khaf/functions/minecraft/schema.js'
import type { InferType } from '@sapphire/shapeshift'
import assert from 'node:assert'
import { Buffer } from 'node:buffer'
import { request } from 'undici'

type Profile = InferType<typeof profileSchema>

/**
 * @see https://wiki.vg/Mojang_API#UUID_to_Profile_and_Skin.2FCape
 */
export async function profile (uuid: string): Promise<Profile>
export async function profile (uuid: string, modifier: keyof typeof textures): Promise<string[]>
export async function profile (uuid: string, modifier?: keyof typeof textures): Promise<Profile | string[]> {
  const url = new URL(uuid, routes.profile)
  const { body, statusCode } = await request(url)
  assert(statusCode === 200)

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
