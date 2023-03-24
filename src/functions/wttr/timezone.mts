import { routes } from '#khaf/functions/wttr/constants.mjs'
import assert from 'node:assert'
import { request } from 'undici'

let timezones: Set<string> | undefined

export const timezone = async (location: string): Promise<string> => {
  // https://github.com/microsoft/TypeScript/issues/49231
  // eslint-disable-next-line
  timezones ??= new Set((Intl as any).supportedValuesOf('timeZone'))
  location = encodeURIComponent(location)

  const { statusCode, body } = await request(new URL(`${location}?format=%Z`, routes.base))
  const tz = await body.text()

  assert(statusCode === 200)
  assert(timezones.has(tz))

  return tz
}
