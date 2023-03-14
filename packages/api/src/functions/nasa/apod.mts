import { base, earliest } from '#/functions/nasa/constants.mjs'

export const apod = async (params: URLSearchParams): Promise<Response> => {
  const dateString = params.get('date')
  const now = new Date()
  const date = dateString ? new Date(dateString) : now
  const tomorrow = new Date().setDate(now.getDate() + 1)

  if (dateString && date.toString() === 'Invalid Date') {
    return Response.json({ error: 'invalid date' }, { status: 400 })
  } else if (date.getTime() < earliest || date.getTime() >= tomorrow) {
    return Response.json({ error: 'invalid date' }, { status: 404 })
  }

  let max = 5

  while (max--) {
    const formatted = [
      `${date.getFullYear()}`.slice(2),
      `${date.getMonth() + 1}`.padStart(2, '0'),
      `${date.getDate()}`.padStart(2, '0')
    ].join('')

    const response = await fetch(`https://apod.nasa.gov/apod/ap${formatted}.html`)

    if (!response.ok) {
      date.setDate(date.getDate() - 1)
      continue
    }

    const copyright: string[] = []
    const attributes = {
      explanation: '',
      url: '',
      title: '',
      mediaType: 'other',
      hdurl: '',
      copyright: '',
      link: response.url
    } satisfies Record<string, string>

    await new HTMLRewriter()
      .on('img[src]', {
        element (element) {
          attributes.url = `${base}${element.getAttribute('src')}`
          attributes.mediaType = 'image'
        }
      })
      .on('a[href^="image"]', {
        element (element) {
          attributes.hdurl = `${base}${element.getAttribute('href')}`
          attributes.mediaType = 'image'
        }
      })
      .on('iframe[src]', {
        element (element) {
          attributes.url = element.getAttribute('src')!
          attributes.mediaType = 'video'
        }
      })
      .on('p:nth-child(3)', {
        text (text) {
          attributes.explanation += text.text
        }
      })
      .on('title', {
        text (text) {
          // old entries
          if (text.text.includes(' - ')) {
            attributes.title = text.text
              .split(' - ')[1]
              .trim()
          }
        }
      })
      .on('center > b:nth-child(1)', {
        text (text) {
          if (!attributes.title) {
            attributes.title = text.text.trim()
          }
        }
      })
      .on('center > a', {
        text (text) {
          const trimmed = text.text.trim()
          if (trimmed.length) {
            copyright.push(trimmed)
          }
        }
      })
      .transform(response)
      .text()

    attributes.explanation = attributes.explanation
      .replace(/\n| +/g, ' ')
      .replace(/^ +| +$/g, '')
      .replace('Explanation: ', '')
      .split(' Tomorrow\'s picture')[0]
      .replace(/^ +| +$/g, '')

    attributes.copyright = copyright
      .slice(0, -1) // remove tomorrow's picture
      .join(', ')

    return Response.json(attributes)
  }

  return Response.json({ error: 'no images found' }, { status: 400 })
}
