import { routes } from '#/functions/duckduckgo/constants.mjs'
import { images } from '#/functions/duckduckgo/schema.mjs'
import { getVQD } from '#/functions/duckduckgo/utility.mjs'
import { decodeXML } from 'entities'

// duck-duck-scrape. MIT License. Copyright (c) 2018-2021 suushii & Snazzah
// duck-duck-scrape. MIT License. Copyright (c) 2021-present Snazzah

interface Options {
  safeSearch: `${typeof SafeSearchType[keyof typeof SafeSearchType]}`
  locale: string
  offset: number
}

const SafeSearchType = {
  STRICT: 0,
  MODERATE: -1,
  OFF: -2
} as const

export const searchImages = async (params: URLSearchParams): Promise<Response> => {
  const query = params.get('q')
  const safeSearch = params.get('safeSearch') ?? `${SafeSearchType.STRICT}`

  if (!query) {
    return Response.json({ error: 'no q' }, { status: 400 })
  } else if (!Object.values(SafeSearchType).includes(Number(safeSearch) as 0)) {
    return Response.json({
      error: 'invalid safeSearch'
    }, { status: 400 })
  }

  const options: Options = {
    safeSearch: safeSearch as `${0}`,
    locale: params.get('locale') ?? 'en-us',
    offset: 0
  }

  const token = await getVQD(query, 'web')

  if (!token) {
    return Response.json({ error: 'no token found' }, {
      status: 400
    })
  }

  const queryObject = new URLSearchParams({
    l: options.locale,
    o: 'json',
    q: query,
    vqd: token,
    p: Number(options.safeSearch) === SafeSearchType.STRICT ? '1' : '-1',
    f: ',,,,',
    s: options.offset.toString()
  }).toString()

  const response = await fetch(`${routes.images}?${queryObject}`)

  if (response.status !== 200) {
    return Response.json({
      error: `Invalid response ${response.status}`,
      text: await response.text()
    })
  }

  const imagesResult = await response.json()

  if (!images.is(imagesResult)) {
    return Response.json({
      error: 'unknown response from server',
      text: JSON.stringify(imagesResult, null, 2)
    }, { status: 400 })
  }

  return Response.json({
    vqd: token,
    results: imagesResult.results.map((image) => ({
      ...image,
      title: decodeXML(image.title)
    }))
  }, {
    status: 200
  })
}
