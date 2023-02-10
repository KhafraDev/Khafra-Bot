import { s } from '@sapphire/shapeshift'

export const nameToUUIDSchema = s.object({
  name: s.string,
  id: s.string // uuid without dashes
})

export const profileSchema = s.object({
  id: s.string,
  name: s.string,
  properties: s.array(s.object({
    name: s.string,
    value: s.string
  })),
  legacy: s.boolean.true.optional
}).ignore

export const profileTextures = s.object({
  timestamp: s.number,
  profileId: s.string,
  profileName: s.string,
  signatureRequired: s.boolean.true.optional,
  textures: s.object({
    SKIN: s.object({ url: s.string }).ignore.optional,
    CAPE: s.object({ url: s.string }).ignore.optional
  }).ignore
})
