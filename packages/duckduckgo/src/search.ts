export const search = async (query: string): Promise<Response> => {
  query += '+site:youtube.com'
  query = query.replaceAll(/\s/g, '+')

  const urls: string[] = []
  const response = await fetch('https://html.duckduckgo.com/html/', {
    headers: {
      'User-Agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot)',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `q=${query}&b=&kl=&df=`,
    method: 'POST'
  })

  const rewriter = new HTMLRewriter().on('a', {
    element (element) {
      const classList = element.getAttribute('class')
      if (classList === 'result__url') {
        const href = element.getAttribute('href')!

        urls.push(href)
      }
    }
  })

  await rewriter.transform(response).text()

  return Response.json(urls)
}
