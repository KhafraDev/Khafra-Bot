const { existsSync, readFileSync } = require('node:fs')
const { join } = require('node:path')
const { cwd, env } = require('node:process')

const propertyDescriptors = {
  writable: true,
  configurable: true,
  enumerable: true
}

const path = join(cwd(), '.env')
if (!existsSync(path)) {
  throw new Error('.env: No .env file found at the root of the repo!')
}

const file = readFileSync(path, 'utf-8').split(/\r?\n/g)
for (const line of file) {
  if (line.startsWith('#')) continue

  const [k, ...v] = line.split('=')
  const value = v.join('=')

  Object.defineProperty(env, k, {
    value: value.startsWith('"') && value.endsWith('"')
      ? value.slice(1, -1)
      : value,
    ...propertyDescriptors
  })
}
