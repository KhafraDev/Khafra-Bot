import { logError } from '#khaf/utility/Rejections.js'
import { URLFactory } from '#khaf/utility/Valid/URL.js'
import type { Attachment } from 'discord.js'
import { decodeXML } from 'entities'
import { type Blob } from 'node:buffer'
import { basename } from 'node:path'
import { FormData, request } from 'undici'

/*** Get the image from the html */
const R = /<div class="image">\s+<img src="(.*?)">/

/**
 * Cartoonize an image using AI from an unofficial API.
 */
export class Cartoonize {
    static async blobFromUrl(url: string): Promise<Blob | null> {
        const u = URLFactory(url)
        if (u === null) return null

        const res = await request(u).catch((err: Error) => {
            logError(err)
            return null
        })

        if (res !== null) {
            return res.body.blob()
        }

        return null
    }

    static async cartoonize(attachment: Attachment): Promise<string | null> {
        const form = new FormData()
        const blob = await Cartoonize.blobFromUrl(attachment.proxyURL)

        if (blob === null) return null
        form.append('image', blob, basename(attachment.proxyURL))

        const { body } = await request('https://cartoonize-lkqov62dia-de.a.run.app/cartoonize', {
            method: 'POST',
            body: form
        })

        const j = await body.text()
        const url = R.exec(j)![1]

        return decodeXML(url)
    }
}