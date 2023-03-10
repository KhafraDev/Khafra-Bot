import { ImageUtil } from '#khaf/image/ImageUtil.mjs'
import { Interactions } from '#khaf/Interaction'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { arrayBufferToBuffer } from '#khaf/utility/util.mjs'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { env } from 'node:process'
import { request } from 'undici'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'cartoonize',
      description: 'Use AI to cartoonize an image.',
      options: [
        {
          type: ApplicationCommandOptionType.Attachment,
          name: 'image',
          description: 'The image to cartoonize.',
          required: true
        }
      ]
    }

    super(sc, {
      defer: true
    })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
    const image = interaction.options.getAttachment('image', true)

    if (!ImageUtil.isImage(image.proxyURL, image.contentType)) {
      return {
        content: 'What am I supposed to do with that? That\'s not an image!',
        ephemeral: true
      }
    }

    const { body: stream } = await request(image.proxyURL)
    const url = new URL('/cartoonize/', env.WORKER_API_BASE)

    const { body: imageBody } = await request(url, {
      method: 'POST',
      headers: {
        'content-type': image.contentType ?? 'image/jpg'
      },
      body: stream
    })

    const embed = Embed.json({
      image: { url: 'attachment://cartoonized.jpeg' }
    })

    const reply = await interaction.editReply({
      embeds: [embed],
      files: [{
        attachment: arrayBufferToBuffer(await imageBody.arrayBuffer()),
        name: 'cartoonized.jpeg'
      }]
    })

    const link = reply.embeds[0].image?.proxyURL ?? reply.embeds[0].image?.url
    embed.description = `[Click Here](${link}) to download!`

    await reply.edit({
      embeds: [embed]
    })
  }
}
