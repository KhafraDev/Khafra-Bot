import { s } from '@sapphire/shapeshift'

export const languageSchema = s.object({
  code: s.string,
  name: s.string
}).array

export const translatedSchema = s.object({ translatedText: s.string })
