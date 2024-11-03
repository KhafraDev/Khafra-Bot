import { createDeferredPromise } from '#khaf/utility/util.mjs'
import { DEFAULT_CIPHERS } from 'node:tls'
import { Agent } from 'undici'

const defaultCiphers = DEFAULT_CIPHERS.split(':')
const shuffledCiphers = [
  defaultCiphers[0],
  defaultCiphers[2],
  defaultCiphers[1],
  ...defaultCiphers.slice(3)
].join(':')

const agent = new Agent({
  maxRedirections: 0,
  connect: {
    ciphers: shuffledCiphers
  }
})

export function request (path: string) {
  const promise = createDeferredPromise<Buffer>()
  const body: Buffer[] = []

  agent.dispatch(
    {
      method: 'GET',
      origin: 'https://old.reddit.com',
      path,
      headers: {
        'User-Agent': 'curl/8.7.1',
        Accept: '*/*',
      }
    },
    {
      onConnect () {},
      onHeaders (statusCode) {
        if (statusCode !== 200) {
          promise.reject()
          return false
        }

        return true
      },
      onData (data) {
        body.push(data)

        return true
      },
      onComplete () {
        promise.resolve(Buffer.concat(body))
      },
      onError (error) {
        promise.reject(error)
      }
    }
  )

  return promise.promise
}
