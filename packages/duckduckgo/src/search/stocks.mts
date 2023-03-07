import { getVQD } from '../utility.mjs'
import { routes } from '../constants.mjs'
import { stockQuote, stockIntraday } from '../schema.mjs'

export const getStockInfo = async (query: string): Promise<Response> => {
  const token = await getVQD(query, 'stock')

  if (!token) {
    return Response.json({ error: 'no token found' }, {
      status: 400
    })
  }

  const params = {
    symbol: query,
    query,
    vqd: token
  } as const

  const quote = new URLSearchParams({ action: 'quote', ...params }).toString()
  const intraday = new URLSearchParams({ action: 'intraday', ...params }).toString()

  const [response1, response2] = await Promise.all([
    fetch(`${routes.stocks}?${quote}`).then(r => r.json()),
    fetch(`${routes.stocks}?${intraday}`).then(r => r.json())
  ])

  if (!stockQuote.is(response1)) {
    return Response.json({
      error: 'unknown response from server',
      text: JSON.stringify(response1, null, 2)
    }, { status: 400 })
  }

  if (!stockIntraday.is(response2)) {
    return Response.json({
      error: 'unknown response [2] from server',
      text: JSON.stringify(response2, null, 2)
    }, { status: 400 })
  }

  return Response.json({
    stock: response1,
    intraday: response2
  })
}
