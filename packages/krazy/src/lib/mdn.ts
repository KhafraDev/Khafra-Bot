export interface MDNSearchResult {
  mdn_url: string
  score: number
  title: string
  locale: string
  slug: string
  popularity: number
  archived: boolean
  summary: string
  highlight: {
    body: string[]
    title: string[]
  }
}

export interface MDNResult {
  documents: MDNSearchResult[]
  metadata: {
    took_ms: number
    total: { value: number, relation: string }
    size: number
    page: 1
  }
  suggestions: string[]
}

export interface MDNError {
  errors: {
    [key: string]: {
      message: string
      code: string
    }[]
  }
}

const defaultOpts = {
    locale: 'en-US'
}

const search = 'https://developer.mozilla.org/api/v1/search'

/**
* Fetch results from MDN's official API!
* @example
* // Search for "fetch", locale defaults to 'en-US'
* const results = await fetchMDN('fetch');
*
* @example
* // Use a different locale
* const results = await fetchMDN('fetch', { locale: 'es' });
*/
export const fetchMDN = async (q: string, opts = defaultOpts): Promise<MDNResult | MDNError> => {
    if (typeof q !== 'string' || q.trim().length === 0)
        throw new RangeError(`Expected query type "string", got "${typeof q}"!`)

    q = encodeURIComponent(q.replace(/\s/g, '+'))

    // eslint-disable-next-line no-restricted-globals
    const params = new URLSearchParams([
        ['q', q],
        ['locale', opts.locale]
    ])

    const response = await fetch(`${search}?${params}`)
    return await response.json()
}
