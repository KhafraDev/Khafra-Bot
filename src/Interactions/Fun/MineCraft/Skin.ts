import { skin as getSkin } from '#khaf/functions/minecraft/textures.js'
import { usernameToUUID } from '#khaf/functions/minecraft/username-to-uuid.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import { Buttons, Components } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { arrayBufferToBuffer } from '#khaf/utility/FetchUtils.js'
import { bold } from '@discordjs/builders'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'
import type { AssertionError } from 'node:assert'

export class kSubCommand extends InteractionSubCommand {
  constructor () {
    super({
      references: 'minecraft',
      name: 'skin'
    })
  }

  async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const username = interaction.options.getString('username', true)
    const type = interaction.options.getString('type') ?? 'frontfull'
    let uuid

    try {
      uuid = await usernameToUUID(username)
    } catch (e) {
      return {
        content: (e as AssertionError).message || 'No player with that name could be found.',
        ephemeral: true
      }
    }

    const description = `
		● ${bold('Username:')} ${uuid.name}
		● ${bold('ID:')} ${uuid.id}
		`

    if (type === 'skin') {
      const skin = await getSkin(uuid.id)
      const { body } = await request(skin[0])
      const b = arrayBufferToBuffer(await body.arrayBuffer())

      return {
        embeds: [
          Embed.json({
            color: colors.ok,
            description,
            image: { url: 'attachment://skin.png' }
          })
        ],
        components: [
          Components.actionRow([
            Buttons.link(
              'Change Skin',
              `https://www.minecraft.net/en-us/profile/skin/remote?url=${skin}&model=classic`
            )
          ])
        ],
        files: [{
          attachment: b,
          name: 'skin.png'
        }]
      }
    }

    return {
      embeds: [
        Embed.json({
          color: colors.ok,
          description,
          image: { url: `https://visage.surgeplay.com/${type}/512/${uuid.id}` }
        })
      ]
    }
  }
}
