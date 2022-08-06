import { InteractionSubCommand } from '#khaf/Interaction'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

interface RandomFoxCA {
    image: string
    link: string
}

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'fox'
        })
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        await interaction.deferReply()

        const { body, statusCode } = await request('https://randomfox.ca/floof/')

        if (statusCode !== 200) {
            return {
                content: '🦊 Couldn\'t get a picture of a random fox!',
                ephemeral: true
            }
        }

        const j = await body.json() as RandomFoxCA

        return {
            content: j.image
        }
    }
}