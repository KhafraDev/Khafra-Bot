import { ImageUtil } from '#khaf/image/ImageUtil.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import { arrayBufferToBuffer } from '#khaf/utility/FetchUtils.js'
import { seconds } from '#khaf/utility/ms.js'
import type { ImageURLOptions } from '@discordjs/rest'
import { Transformer } from '@napi-rs/image'
import type { Attachment, ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Buffer } from 'node:buffer'
import { once } from 'node:events'
import { Worker } from 'node:worker_threads'
import { request } from 'undici'

const options: ImageURLOptions = { extension: 'png', size: 256 }

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'memes',
      name: 'magik'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const option =
			interaction.options.getAttachment('image') ??
			interaction.options.getUser('person')?.displayAvatarURL(options) ??
			interaction.user.displayAvatarURL(options)

    const buffer = await this.image(option)

    if (typeof buffer === 'string') {
      return { content: buffer, ephemeral: true }
    }

    return {
      files: [
        {
          attachment: Buffer.from(buffer, buffer.byteOffset, buffer.byteLength),
          name: 'magik.png'
        }
      ]
    }
  }

  async image (avatarURL: string | Attachment): Promise<Uint8ClampedArray | string> {
    if (typeof avatarURL === 'string') {
      if (!ImageUtil.isImage(avatarURL)) {
        return '❌ This file type is not supported.'
      }
    } else if (!ImageUtil.isImage(avatarURL.proxyURL)) {
      return '❌ This file type is not supported.'
    }

    const { body } = await request(typeof avatarURL === 'string' ? avatarURL : avatarURL.proxyURL)
    const buffer = arrayBufferToBuffer(await body.arrayBuffer())

    const transformer = new Transformer(buffer)
    const { width, height } = await transformer.metadata()

    if (width > 1024 || height > 1024) {
      transformer.resize({
        width: Math.min(1024, width),
        height: Math.min(1024, height)
      })
    }

    const ac = new AbortController()
    const timeout = setTimeout(() => ac.abort(), seconds(60))

    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads')
      const { magik } = require('@khaf/magik')

      parentPort.postMessage(magik(workerData))
    `, {
      eval: true,
      workerData: await transformer.png()
    })

    const [magiked] = await once(worker, 'message', {
      signal: ac.signal
    }) as [Uint8ClampedArray]

    clearTimeout(timeout)

    return magiked
  }
}
