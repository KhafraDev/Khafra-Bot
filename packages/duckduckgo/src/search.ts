export const search = async (query: string): Promise<Response> => {
  query += 'site:youtube.com'

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
