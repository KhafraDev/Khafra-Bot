/*
 * Originally based VERY-roughly on https://github.com/DarinRowe/googletrans (v1.0.0, MIT license).
 * Refined from this comment, https://github.com/matheuss/google-translate-api/issues/79#issuecomment-426007365,
 * that removes the token entirely.
 */

import { decompressBody } from '#khaf/utility/util.mjs'
import { s } from '@sapphire/shapeshift'
import assert from 'node:assert'
import { json } from 'node:stream/consumers'
import { URL, URLSearchParams } from 'node:url'
import { request } from 'undici'

interface Opts {
  to?: string
  from?: string
  query: string
}

const optionSchema = s.object({
  to: s.string.optional.default('en').transform(
    (value) => langs.has(value) ? value : 'es'
  ),
  from: s.string.optional.default('auto').transform(
    (value) => langs.has(value) ? value : 'en'
  ),
  query: s.string
})

export const langs = new Set([
  'auto', 'af', 'sq', 'am', 'ar',
  'hy', 'az', 'eu', 'be', 'bn',
  'bs', 'bg', 'ca', 'ceb', 'ny',
  'zh', 'zh-cn', 'zh-sg', 'zh-tw',
  'zh-hk', 'co',  'hr',  'cs', 'da',
  'nl', 'en', 'eo', 'et', 'tl',
  'fi', 'fr', 'fy', 'gl', 'ka',
  'de', 'el', 'gu', 'ht', 'ha',
  'haw', 'he', 'iw', 'hi', 'hmn',
  'hu', 'is', 'ig', 'id', 'ga',
  'it', 'ja', 'jw', 'kn', 'kk',
  'km', 'ko', 'ku', 'ky', 'lo',
  'la', 'lv', 'lt', 'lb', 'mk',
  'mg', 'ms', 'ml', 'mt', 'mi',
  'mr', 'mn', 'my', 'ne', 'no',
  'ps', 'fa', 'pl', 'pt', 'pa',
  'ro', 'ru', 'sm', 'gd', 'sr',
  'st', 'sn', 'sd', 'si', 'sk',
  'sl', 'so', 'es', 'su', 'sw',
  'sv', 'tg', 'ta', 'te', 'th',
  'tr', 'uk', 'ur', 'uz', 'vi',
  'cy', 'xh', 'yi', 'yo', 'zu', 'fil'
])

const staticParams = new URLSearchParams([
  ['client', 'gtx'],
  ['hl', 'en'],
  ['dt', 'at'], ['dt', 'bd'], ['dt', 'ex'], ['dt', 'ld'], ['dt', 'md'],
  ['dt', 'qca'], ['dt', 'rw'], ['dt', 'rm'], ['dt', 'ss'], ['dt', 't'],
  ['ie', 'UTF-8'],
  ['oe', 'UTF-8'],
  ['otf', '1'],
  ['ssel', '0'],
  ['tsel', '0'],
  ['kc', '7']
])

export const translate = async (opts: Opts): Promise<string> => {
  const { to, from, query } = optionSchema.parse(opts)

  const url = 'https://translate.google.com/translate_a/single?'
  const params = new URLSearchParams(staticParams)
  params.append('sl', from)
  params.append('tl', to)
  params.append('q', query)

  const response = await request(new URL(`?${params}`, url), {
    headers: {
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:87.0) Gecko/20100101 Firefox/87.0'
    }
  })

  const text = decompressBody(response)

  // setting real types for this is a waste of time
  const j: unknown = await json(text)

  assert(Array.isArray(j) && Array.isArray(j[0]))

  let out = ''

  for (const piece of j[0]) {
    assert(Array.isArray(piece))

    out += piece[0]
  }

  return out
}
