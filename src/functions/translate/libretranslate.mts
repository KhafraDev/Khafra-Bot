import { languageSchema, translatedSchema } from '#khaf/functions/translate/schema.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import { s } from '@sapphire/shapeshift'
import { FormData, request } from 'undici'

interface Options {
  to?: string
  from?: string
  query: string
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const optionSchema = (langs: Set<string>) => s.object({
  to: s.string.optional.default('en').transform(
    (value) => langs.has(value) ? value : 'en'
  ),
  from: s.string.optional.default('auto').transform(
    (value) => langs.has(value) ? value : 'auto'
  ),
  query: s.string
})

export const getLanguages = once(async () => {
  const { body } = await request('https://libretranslate.com/languages')
  const j: unknown = await body.json()

  if (!languageSchema.is(j)) {
    return new Set<string>()
  }

  return new Set(j.map(l => l.code))
})

export const translate = async (opts: Options): Promise<string | null> => {
  const languages = await getLanguages()
  const options = optionSchema(languages).parse(opts)

  const form = new FormData()
  form.set('q', options.query)
  form.set('source', options.from)
  form.set('target', options.to)
  form.set('format', 'text')
  form.set('api_key', '')

  const { body, statusCode } = await request('https://libretranslate.com/translate', {
    method: 'POST',
    body: form,
    headers: {
      'User-Agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot)',
      // https://github.com/LibreTranslate/LibreTranslate/blob/ffc0c1dcda7ffc6870b3767f83624c32b8525609/app/app.py#L180
      'Origin': 'https://libretranslate.com'
    }
  })

  if (statusCode !== 200) {
    return null
  }

  const json: unknown = await body.json()

  if (!translatedSchema.is(json)) {
    return null
  }

  return json.translatedText
}
