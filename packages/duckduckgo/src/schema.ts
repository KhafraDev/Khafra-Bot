import { s } from '@sapphire/shapeshift'

export const stockQuote = s.object({
  assetType: s.string,
  avgTotalVolume: s.number,
  change: s.number,
  changePercent: s.number,
  companyName: s.string,
  currency: s.string,
  high: s.number,
  latestPrice: s.number,
  latestUpdate: s.number,
  low: s.number,
  marketCap: s.number,
  open: s.number,
  openTime: s.number,
  peRatio: s.number,
  previousClose: s.number,
  primaryExchange: s.string,
  symbol: s.string,
  week52High: s.number,
  week52Low: s.number
})

export const stockIntraday = s.object({
  close: s.number.nullable,
  date: s.string,
  minute: s.string
}).array

export const images = s.object({
  results: s.object({
    height: s.number,
    width: s.number,
    image: s.string,
    image_token: s.string,
    source: s.string,
    thumbnail: s.string,
    thumbnail_token: s.string,
    title: s.string,
    url: s.string
  }).array
}).ignore
