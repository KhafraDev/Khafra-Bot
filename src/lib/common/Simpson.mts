// https://www.thisfuckeduphomerdoesnotexist.com/
// had to include this one

import { request } from 'undici'

interface ISimpson {
  url: string
  key: string
  next_item_key: string
  next_item_url: string
  transition_url: string
  permalink: string
}

const url = 'https://www.thisfuckeduphomerdoesnotexist.com/'
let key: string | null = null

export const fetchOGKey = async (): Promise<string | null> => {
  const { body } = await request(url)
  const text = await body.text()

  return /"next_item_key": "(?<key>.*?)"/.exec(text)?.groups?.key ?? null
}

export const thisSimpsonDoesNotExist = async (): Promise<string> => {
  key ??= await fetchOGKey()

  const { body } = await request(`${url}item/${key}`)
  const json = await body.json() as ISimpson

  key = json.next_item_key
  return json.next_item_url
}
