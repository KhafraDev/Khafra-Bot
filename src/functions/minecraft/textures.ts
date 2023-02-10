import { textures } from '#khaf/functions/minecraft/constants.js'
import { profile } from '#khaf/functions/minecraft/profile.js'

export const capes = (uuid: string): Promise<string[]> => profile(uuid, textures.CAPE)
export const skin = (uuid: string): Promise<string[]> => profile(uuid, textures.SKIN)
