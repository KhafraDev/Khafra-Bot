import type { URL } from 'node:url'
import { request } from 'undici'

export const talkObamaToMe = async (q: string): Promise<string> => {
  q = encodeURIComponent(q)

  const { context: ctx } = await request('http://talkobamato.me/synthesize.py', {
    method: 'POST',
    body: `input_text=${q}`,
    headers: {
      Referer: 'http://talkobamato.me/',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    // https://github.com/nodejs/undici/pull/769
    maxRedirections: 1
  })

  const context = ctx as { history: URL[] }
  const u = context.history[context.history.length - 1]
  const speechKey = u.searchParams.get('speech_key')

  return `http://talkobamato.me/synth/output/${speechKey}/obama.mp4`
}
