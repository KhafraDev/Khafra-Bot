import { Interactions } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { hyperlink } from '@discordjs/builders'
import type { ImageExtension, ImageSize } from '@discordjs/rest'
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

const sizes: ImageSize[] = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096]
const formats: ImageExtension[] = ['webp', 'png', 'jpg', 'jpeg', 'gif']

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'avatar',
      description: 'Get someone\'s avatar!',
      options: [
        {
          type: ApplicationCommandOptionType.User,
          name: 'user',
          description: 'User to get the avatar of.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'size',
          description: 'Set the size of the avatar image.',
          choices: sizes.map((s) => ({ name: `${s}`, value: `${s}` }))
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'format',
          description: 'Set the image type of the avatar.',
          choices: formats.map((f) => ({ name: f, value: f }))
        }
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const user = interaction.options.getUser('user', true)
    const size = interaction.options.getString('size') ?? '256'
    const format = interaction.options.getString('format') ?? 'webp'

    const avatar = user.displayAvatarURL({
      size: Number(size) as ImageSize,
      extension: format as ImageExtension
    })

    return {
      embeds: [
        Embed.json({
          color: colors.ok,
          description: user.avatar ? hyperlink(user.avatar, avatar) : undefined,
          image: { url: avatar }
        })
      ]
    }
  }
}
