/* eslint-disable no-restricted-globals */

const handleEvent = async (request: Request): Promise<Response> => {
  const { searchParams } = new URL(request.url)
  let query = searchParams.get('q')

  if (query === null) {
    return Response.json({
      error: 'Missing q parameter'
    }, { status: 400 })
  } else {
    query += 'site:youtube.com'
  }

  const urls: string[] = []
  const encoded = encodeURIComponent(query.replaceAll(/\s/g, '+'))
  const response = await fetch(`https://html.duckduckgo.com/html/?q=${encoded}`, {
    headers: {
      'user-agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot)'
    }
  })

  const rewriter = new HTMLRewriter().on('a', {
    element (element) {
      const classList = element.getAttribute('class')
      if (classList === 'result_a' || classList === 'result__snippet') {
        const href = element.getAttribute('href')
        const url = new URL(href!, 'https://duckduckgo.com')
        const uddg = url.searchParams.get('uddg')

        if (uddg !== null) {
          urls.push(uddg)
        }
      }
    }
  })

  await rewriter.transform(response).text()

  return Response.json(urls)
}

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event.request))
})
