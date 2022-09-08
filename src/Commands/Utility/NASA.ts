import { Command } from '#khaf/Command'
import { cache, NASAGetRandom } from '#khaf/utility/commands/NASA'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { dontThrow } from '#khaf/utility/Don\'tThrow.js'
import { inlineCode } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get a random Astronomy Photo of the Day (APOD) supplied by NASA.'
            ],
            {
                name: 'apod',
                folder: 'Utility',
                args: [0, 0],
                aliases: ['nasa']
            }
        )
    }

    async init (message: Message): Promise<APIEmbed> {
        if (cache.length === 0) {
            void message.channel.sendTyping()
        }

        const [err, result] = await dontThrow(NASAGetRandom())

        if (err !== null) {
            return Embed.error(`An unexpected error occurred: ${inlineCode(err.message)}`)
        } else if (result === null) {
            return Embed.error('No images were fetched, try again?')
        }

        return Embed.json({
            color: colors.ok,
            image: { url: result.link },
            title: result.title,
            footer: typeof result.copyright === 'string'
                ? { text: `© ${result.copyright}` }
                : undefined
        })
    }
}