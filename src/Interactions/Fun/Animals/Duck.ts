import { InteractionSubCommand } from '#khaf/Interaction'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

interface RandomDUK {
    message: string
    url: string
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'duck'
        })
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        await interaction.deferReply()

        const { body, statusCode } = await request('https://random-d.uk/api/v1/random')

        if (statusCode !== 200) {
            return {
                content: '🦆 Couldn\'t get a picture of a random duck!',
                ephemeral: true
            }
        }

        const j = await body.json() as RandomDUK

        return {
            content: j.url
        }
    }
}