import type { MessageReplyOptions } from 'discord.js'
import { request } from 'undici'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'
import { arrayBufferToBuffer } from '#khaf/utility/util.mjs'

const formatURL = new Map<DNE, string>([
  ['artwork', 'https://thisartworkdoesnotexist.com/'],
  ['cat', 'https://thiscatdoesnotexist.com/'],
  ['horse', 'https://thishorsedoesnotexist.com/'],
  ['person', 'https://thispersondoesnotexist.com/image']
])

export type DNE = 'artwork' | 'cat' | 'horse' | 'person'

export const thisDoesNotExist = async (type: DNE): Promise<MessageReplyOptions | null> => {
  const url = formatURL.get(type)
  if (!url) return null

  const { body } = await request(url)
  const buffer = arrayBufferToBuffer(await body.arrayBuffer())

  return {
    embeds: [
      Embed.json({
        color: colors.ok,
        image: { url: `attachment://t${type}dne.jpeg` }
      })
    ],
    files: [
      {
        attachment: buffer,
        name: `t${type}dne.jpeg`,
        description: `A random${type === 'artwork' ? ' piece of' : ''} ${type}!`
      }
    ],
    failIfNotExists: false
  }
}
