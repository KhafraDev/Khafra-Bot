import { InteractionSubCommand } from '#khaf/Interaction'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { assets } from '#khaf/utility/Constants/Path.js'
import { readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'

const recipeImages = readdirSync(assets('MineCraft/recipes'))

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'minecraft',
            name: 'recipe'
        })
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const itemName = interaction.options.getString('item', true)
        const item = recipeImages.find((fileName) => fileName.startsWith(itemName))

        if (item === undefined) {
            return {
                content: `${itemName} is not a valid item, or has no crafting recipe.`,
                ephemeral: true
            }
        }

        const image = await readFile(assets('MineCraft/recipes', item))

        return {
            embeds: [
                Embed.json({
                    color: colors.ok,
                    image: { url: 'attachment://recipe.png' }
                })
            ],
            files: [{
                attachment: image,
                name: 'recipe.png'
            }]
        }
    }
}