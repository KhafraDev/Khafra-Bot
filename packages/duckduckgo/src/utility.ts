export async function getVQD (query: string, ia: string): Promise<string | undefined> {
  const search = new URLSearchParams({ q: query, ia })
  const response = await fetch(`https://duckduckgo.com/?${search}`, {
    headers: {
      accept: '*/*',
      host: 'duckduckgo.com'
    }
  })

  return /vqd='(\d+-\d+(?:-\d+)?)'/.exec(await response.text())?.[1]
}
