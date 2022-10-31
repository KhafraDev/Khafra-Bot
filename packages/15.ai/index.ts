import { clearTimeout, setTimeout } from 'node:timers'
import { request } from 'undici'
import { s, type InferType } from '@sapphire/shapeshift'

const schema = s.object({
  batch: s.array(s.number),
  wavNames: s.array(s.string),
  scores: s.array(s.number),
  torchmoji: s.union(s.array(s.number), s.array(s.string)),
  text_parsed: s.array(s.string),
  tokenized: s.array(s.string),
  dict_exists: s.array(s.array(s.string))
})

type Batch = InferType<typeof schema>

export class FifteenDotAI {
  static async getWav(
    character: string,
    content: string,
    emotion: string
  ): Promise<Batch | null> {
    const ac = new AbortController()
    const timeout = setTimeout(() => ac.abort(), 60_000)

    const {
      body,
      statusCode
    } = await request('https://api.15.ai/app/getAudioFile5', {
      method: 'POST',
      headers: {
        'User-Agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot, v1.10)',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Content-Type': 'application/json;charset=utf-8'
      },
      body: JSON.stringify({
        character,
        text: content,
        emotion
      }),
      headersTimeout: 1000 * 60 * 2,
      signal: ac.signal
    })

    clearTimeout(timeout)

    if (statusCode === 200) {
      const json: unknown = await body.json().catch(() => null)

      if (json !== null && schema.is(json)) {
        return json
      }
    }

    return null
  }
}
