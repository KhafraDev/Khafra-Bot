import { InteractionSubCommand } from '#khaf/Interaction'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

interface DogCEO {
    message: string
    status: string // "success" | "error"?
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'dog'
        })
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        await interaction.deferReply()

        const { body, statusCode } = await request('https://dog.ceo/api/breeds/image/random')

        if (statusCode !== 200) {
            return {
                content: '🐶 Couldn\'t get a picture of a random dog!',
                ephemeral: true
            }
        }

        const j = await body.json() as DogCEO

        return {
            content: j.message
        }
    }
}