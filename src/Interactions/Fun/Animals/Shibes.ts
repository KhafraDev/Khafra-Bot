import { InteractionSubCommand } from '#khaf/Interaction'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

const shibes: string[] = []

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'animal',
            name: 'shibe'
        })
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        if (shibes.length === 0) {
            await interaction.deferReply()

            const { body, statusCode } = await request('https://shibe.online/api/shibes?count=100&urls=true&httpsUrls=true')

            if (statusCode !== 200) {
                return {
                    content: '🐶 Couldn\'t get a picture of a random shibe!',
                    ephemeral: true
                }
            }

            const j = await body.json() as string[]

            shibes.push(...j)
        }

        return {
            content: shibes.shift()
        }
    }
}