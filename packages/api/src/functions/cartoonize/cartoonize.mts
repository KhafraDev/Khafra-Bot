import { decodeXML } from 'entities'

const base = 'https://cartoonize-lkqov62dia-de.a.run.app/cartoonize'

export const cartoonize = async (request: Request): Promise<Response> => {
  if (!request.headers.get('content-type')?.startsWith('image/')) {
    return Response.json({ error: 'invalid content-type received' }, { status: 404 })
  }

  const images: string[] = []
  const form = new FormData()
  form.append('image', await request.blob())

  const response = await fetch(base, {
    method: 'POST',
    body: form
  })

  const transformer = new HTMLRewriter().on('div.image > img', {
    element (element) {
      const src = element.getAttribute('src')

      if (src) images.push(src)
    }
  })

  await transformer.transform(response).text()

  if (images.length === 0) {
    return Response.json({ error: 'no images' }, { status: 404 })
  }

  const image = await fetch(new URL(decodeXML(images[0]), base).toString())
  return new Response(image.body)
}
