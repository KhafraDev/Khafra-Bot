import { env } from 'node:process'
import { request } from 'undici'
import { s, type InferType } from '@sapphire/shapeshift'

const schema = s.object({
  definitions: s.object({
    type: s.string,
    definition: s.string,
    example: s.string.or(s.null),
    image_url: s.string.or(s.null),
    emoji: s.string.or(s.null)
  }).array,
  word: s.string,
  pronunciation: s.string.or(s.null)
})

const url = 'https://owlbot.info/api/v4/dictionary/'

export const owlbotio = async (word: string): Promise<InferType<typeof schema> | null> => {
  if (!env.OWLBOTIO) {
    return null
  }

  const { body } = await request(`${url}${encodeURIComponent(word.toLowerCase())}`, {
    headers: {
      Authorization: `Token ${env.OWLBOTIO}`
    }
  })

  const definition: unknown = await body.json()

  if (!schema.is(definition)) {
    return null
  }

  return definition
}
