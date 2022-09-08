import { InteractionSubCommand } from '#khaf/Interaction'
import { Buttons, Components } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { arrayBufferToBuffer } from '#khaf/utility/FetchUtils.js'
import { bold } from '@discordjs/builders'
import { getSkin, UUID } from '@khaf/minecraft'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

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
        const uuid = await UUID(username)

        const description = `
		● ${bold('Username:')} ${uuid?.name}
		● ${bold('ID:')} ${uuid?.id}
		`

        if (uuid === null) {
            return {
                content: '❌ Player could not be found!',
                ephemeral: true
            }
        } else if (type === 'skin') {
            const skin = (await getSkin(uuid.id))[0]
            const { body } = await request(skin)
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