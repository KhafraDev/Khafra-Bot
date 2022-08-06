import { FormData, request } from 'undici'

interface Options {
    to: string
    from: string
    query: string
}

interface APITranslatedResponse {
    translatedText: string
}

type APILanguageResponse = {
    code: string
    name: string
}[]

export const langs: string[] = []

export const getLanguages = async (): Promise<string[]> => {
    if (langs.length !== 0) return langs

    const { body } = await request('https://libretranslate.com/languages')
    const j = await body.json() as APILanguageResponse

    langs.push(...j.map(l => l.code))
    return langs
}

export const translate = async (options: Options): Promise<APITranslatedResponse | null> => {
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

    return statusCode === 200
        ? await body.json() as APITranslatedResponse
        : null
}