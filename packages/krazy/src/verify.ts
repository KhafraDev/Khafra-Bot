// https://gist.github.com/devsnek/77275f6e3f810a9545440931ed314dc1
// https://github.com/advaith1/activities/blob/main/src/verify.ts

function hex2bin (hex: string): Uint8Array {
  const buf = new Uint8Array(Math.ceil(hex.length / 2))

  for (let i = 0; i < buf.length; i++) {
    buf[i] = parseInt(hex.substr(i * 2, 2), 16)
  }

  return buf
}

const PUBLIC_KEY = crypto.subtle.importKey(
  'raw',
  hex2bin(publicKey),
  {
    name: 'NODE-ED25519',
    namedCurve: 'NODE-ED25519'
  },
  true,
  ['verify']
)

const encoder = new TextEncoder()

export const verify = async (request: Request): Promise<boolean> => {
  if (request.method !== 'POST') {
    return false
  }

  const signature = hex2bin(request.headers.get('X-Signature-Ed25519')!)
  const timestamp = request.headers.get('X-Signature-Timestamp')
  const unknown = await request.clone().text()

  const verified = await crypto.subtle.verify(
    'NODE-ED25519',
    await PUBLIC_KEY,
    signature,
    encoder.encode(timestamp + unknown)
  )

  return verified
}
