import { request } from 'undici'

/**
 * @see https://github.com/wukko/cobalt/blob/6d17ff2e06120626cb88fb55622a0f1e26c71bf3/src/modules/sub/utils.js#L16
 */
export type CobaltResponse =
  | { status: 'error'; text: string }
  | { status: 'redirect'; url: string }
  | { status: 'stream'; url: string }
  | { status: 'success'; text: string }
  | { status: 'rate-limit'; text: string }
  | { status: 'picker'; pickerType: 'images' | 'various'; picker: unknown; audio: string }

export async function download (url: URL) {
  const response = await request('https://co.wuk.sh/api/json', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'user-agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot)'
    },
    body: JSON.stringify({ url })
  })

  const body = await response.body.json() as CobaltResponse

  switch (body.status) {
    case 'error':
    case 'rate-limit':
      throw new Error(body.text)
    case 'picker':
      throw new Error('Unsupported response type.')
    case 'redirect':
    case 'stream':
      return body.url
    case 'success':
      return body.text
  }
}
