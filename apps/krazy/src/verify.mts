// https://gist.github.com/devsnek/77275f6e3f810a9545440931ed314dc1
// https://github.com/advaith1/activities/blob/main/src/verify.ts

function hex2bin (hex: string): Uint8Array {
  const buf = new Uint8Array(Math.ceil(hex.length / 2))

  for (let i = 0; i < buf.length; i++) {
    buf[i] = parseInt(hex.substr(i * 2, 2), 16)
  }

  return buf
}

let keyObject: Promise<CryptoKey> | undefined
const encoder = new TextEncoder()

export const verify = async (request: Request, body: string, publicKey: string): Promise<boolean> => {
  if (request.method !== 'POST') {
    return false
  }

  const signature = hex2bin(request.headers.get('X-Signature-Ed25519')!)
  const timestamp = request.headers.get('X-Signature-Timestamp')

  keyObject ??= crypto.subtle.importKey(
    'raw',
    hex2bin(publicKey),
    {
      name: 'NODE-ED25519',
      namedCurve: 'NODE-ED25519'
    },
    true,
    ['verify']
  )

  const verified = await crypto.subtle.verify(
    'NODE-ED25519',
    await keyObject,
    signature,
    encoder.encode(`${timestamp}${body}`)
  )

  return verified
}
