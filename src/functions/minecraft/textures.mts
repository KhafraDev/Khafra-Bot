import { textures } from '#khaf/functions/minecraft/constants.mjs'
import { profile } from '#khaf/functions/minecraft/profile.mjs'

export const capes = (uuid: string): Promise<string[]> => profile(uuid, textures.CAPE)
export const skin = (uuid: string): Promise<string[]> => profile(uuid, textures.SKIN)
