import { searchImages } from './search/images.mjs'
import { search } from './search/search.mjs'
import { getStockInfo } from './search/stocks.mjs'

const handleEvent = async (request: Request): Promise<Response> => {
  const { searchParams, pathname } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return Response.json({
      error: 'no q'
    }, { status: 400 })
  }

  if (pathname === '/image/') {
    return await searchImages(query, searchParams)
  } else if (pathname === '/stocks/') {
    return await getStockInfo(query)
  }

  return await search(query)
}

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event.request))
})
