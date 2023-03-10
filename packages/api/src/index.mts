import { cartoonize } from './functions/cartoonize/cartoonize.mjs'
import { searchImages } from './functions/duckduckgo/search/images.mjs'
import { search } from './functions/duckduckgo/search/search.mjs'
import { getStockInfo } from './functions/duckduckgo/search/stocks.mjs'

const handleEvent = async (request: Request): Promise<Response> => {
  const { searchParams, pathname } = new URL(request.url)

  if (pathname === '/ddg/image/') {
    return await searchImages(searchParams)
  } else if (pathname === '/ddg/stocks/') {
    return await getStockInfo(searchParams)
  } else if (pathname === '/ddg/search/') {
    return await search(searchParams)
  } else if (pathname === '/cartoonize/') {
    return await cartoonize(request)
  }

  return Response.json({ error: `Unknown route ${pathname}` }, { status: 404 })
}

addEventListener('fetch', (event) => {
  event.respondWith(handleEvent(event.request))
})
