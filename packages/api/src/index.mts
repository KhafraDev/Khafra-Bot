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

  if (pathname === '/ddg/image/') {
    return await searchImages(query, searchParams)
  } else if (pathname === '/ddg/stocks/') {
    return await getStockInfo(query)
  } else if (pathname === '/ddg/search/') {
    return await search(query)
  }

  return Response.json({ error: `Unknown route ${pathname}` }, { status: 404 })
}

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event.request))
})
