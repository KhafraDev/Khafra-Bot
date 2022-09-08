import { Buffer } from 'node:buffer'
import { request } from 'undici'
import type { Profile, ProfilePropertiesValue } from '..'

const base = 'https://sessionserver.mojang.com/session/minecraft/profile/' as const

/**
 * @see https://wiki.vg/Mojang_API#UUID_to_Profile_and_Skin.2FCape
 */
export async function getProfile (uuid: string): Promise<Profile>
export async function getProfile (uuid: string, modifier: 'SKIN' | 'CAPE'): Promise<string[]>
export async function getProfile (uuid: string, modifier?: 'SKIN' | 'CAPE'): Promise<Profile | string[]> {
    const { body } = await request(`${base}${uuid}`)
    const j = await body.json() as Profile

    if (modifier === undefined) {
        return j
    }

    const capes: string[] = []

    for (const { value } of j.properties) {
        const data = JSON.parse(Buffer.from(value, 'base64').toString()) as ProfilePropertiesValue
        const texture = data.textures[modifier]

        if (texture !== undefined) {
            capes.push(texture.url)
        }
    }

    return capes
}