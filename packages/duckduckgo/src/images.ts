import { decodeXML } from 'entities'

// duck-duck-scrape. MIT License. Copyright (c) 2018-2021 suushii & Snazzah
// duck-duck-scrape. MIT License. Copyright (c) 2021-present Snazzah

interface ImageResults {
  height: number
  width: number
  image: string
  image_token: string
  source: string
  thumbnail: string
  thumbnail_token: string
  title: string
  url: string
}

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

const getVQD = async (query: string): Promise<string | undefined> => {
  const search = new URLSearchParams({ q: query, ia: 'web' })
  const response = await fetch(`https://duckduckgo.com/?${search}`, {
    headers: {
      accept: '*/*',
      host: 'duckduckgo.com'
    }
  })

  return /vqd='(\d+-\d+(?:-\d+)?)'/.exec(await response.text())?.[1]
}

export const searchImages = async (query: string, params: URLSearchParams): Promise<Response> => {
  const safeSearch = params.get('safeSearch') ?? `${SafeSearchType.STRICT}`

  if (!Object.values(SafeSearchType).includes(Number(safeSearch) as 0)) {
    return Response.json({
      error: 'invalid safeSearch'
    }, { status: 400 })
  }

  const options: Options = {
    safeSearch: safeSearch as `${0}`,
    locale: params.get('locale') ?? 'en-us',
    offset: 0
  }

  const token = await getVQD(query)

  if (!token) {
    return Response.json({ error: 'no token found' }, {
      status: 400
    })
  }

  const queryObject = {
    l: options.locale,
    o: 'json',
    q: query,
    vqd: token,
    p: Number(options.safeSearch) === SafeSearchType.STRICT ? '1' : '-1',
    f: ',,,,',
    s: options.offset.toString()
  }

  const response = await fetch(`https://duckduckgo.com/i.js?${new URLSearchParams(queryObject).toString()}`)

  if (response.status !== 200) {
    return Response.json({
      error: `Invalid response ${response.status}`,
      text: await response.text()
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const imagesResult = await response.json() as { results: ImageResults[] }

  return Response.json({
    vqd: queryObject.vqd,
    results: imagesResult.results.map((image) => ({
      ...image,
      title: decodeXML(image.title)
    }))
  }, {
    status: 200
  })
}
