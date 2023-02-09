import { s } from '@sapphire/shapeshift'
import type { Attachment } from 'discord.js'
import { decodeXML } from 'entities'
import assert from 'node:assert'
import { type Blob } from 'node:buffer'
import { basename } from 'node:path'
import { FormData, request } from 'undici'

const schema = s.string.url({
  allowedDomains: ['cdn.discordapp.com', 'media.discordapp.net'],
  allowedProtocols: ['http:', 'https:']
})

/*** Get the image from the html */
const R = /<div class="image">\s+<img src="(.*?)">/

/**
 * Cartoonize an image using AI from an unofficial API.
 */
export const Cartoonize = {
  async blobFromUrl (url: string): Promise<Blob> {
    assert(schema.is(url))

    const res = await request(url)

    return res.body.blob()
  },

  async cartoonize (attachment: Attachment): Promise<string | null> {
    const form = new FormData()

    form.append(
      'image',
      await Cartoonize.blobFromUrl(attachment.proxyURL),
      basename(attachment.proxyURL)
    )

    const { body } = await request('https://cartoonize-lkqov62dia-de.a.run.app/cartoonize', {
      method: 'POST',
      body: form
    })

    const j = await body.text()
    const url = R.exec(j)![1]

    return decodeXML(url)
  }
}
