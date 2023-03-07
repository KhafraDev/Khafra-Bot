import type { InferType } from '@sapphire/shapeshift'
import { decode } from 'entities'
import { routes } from './constants.mjs'
import type { mdnIndexSchema } from './schema.mjs'

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
  errors: Record<string, {
    message: string
    code: string
  }[]>
}

const search = 'https://developer.mozilla.org/api/v1/search'

export const randomSplit = Math.random().toString(16)

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
export const fetchMDN = async (q: string, opts?: { locale: string }): Promise<MDNResult | MDNError> => {
  if (q.trim().length === 0) {
    throw new RangeError(`Expected query type "string", got "${typeof q}"!`)
  }

  // eslint-disable-next-line no-restricted-globals
  const params = new URLSearchParams([
    ['q', q]
  ])

  if (opts?.locale) {
    params.set('locale', opts.locale)
  }

  const response = await fetch(`${search}?${params}`)
  return await response.json()
}

export const htmlToMarkdown = async (body: InferType<typeof mdnIndexSchema>): Promise<string> => {
  const parts: string[] = []

  for (const part of body.doc.body) {
    if (part.value.content !== undefined) {
      parts.push(`${part.value.title ?? ''}\n${part.value.content}${randomSplit}`)
    }
  }

  const base = new URL(body.doc.mdn_url, routes.mdn).toString()
  const handler = {
    element (element): void {
      element.removeAndKeepContent()
    }
  } satisfies HTMLRewriterElementContentHandlers

  const transformer = new HTMLRewriter()
    .on('span', handler)
    .on('p', handler)
    .on('strong', {
      element (element) {
        element.prepend('**')
        element.append('**')
        element.removeAndKeepContent()
      }
    })
    .on('code', {
      element (element) {
        element.removeAndKeepContent()
      }
    })
    .on('a', {
      element (element) {
        const href = element.getAttribute('href')?.replace(/^\\"(.*?)\\"$/g, '$1')

        if (href) {
          const url = new URL(href, base).toString()
          element.prepend('[')
          element.append(`](${url})`)
        }

        element.removeAndKeepContent()
      }
    })
    .on('iframe', {
      element (element) {
        element.remove()
      }
    })
    .on('div', {
      element (element) {
        const classList = element.getAttribute('class')

        if (classList?.includes('code-example')) {
          element.prepend('```')
          element.append('```')
        }

        element.removeAndKeepContent()
      }
    })
    .on('dt', {
      element (element) {
        element.prepend('`')
        element.append('`')
        element.removeAndKeepContent()
      }
    })
    .on('pre', {
      element (element) {
        element.removeAndKeepContent()
      }
    })
    .on('ul', {
      element (element) {
        element.removeAndKeepContent()
      }
    })
    .on('em', {
      element (element) {
        element.prepend('*')
        element.append('*')
        element.removeAndKeepContent()
      }
    })
    .on('h4', {
      element (element) {
        element.prepend('**')
        element.append('**')
        element.removeAndKeepContent()
      }
    })
    .on('li', handler)
    .on('dl', handler)
    .on('dd', handler)

  const html = Response.json(parts.join('\n'))
  const markdown = await transformer.transform(html).text()

  // &amp;gt; -> &gt; -> >
  return decode(decode(markdown))
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/```(.*?)/g, '```\n')
    .replace(/\n{2,}/gm, '\n')
    .slice(1, -1)
}
