import { Command } from '#khaf/Command'
import { Cartoonize } from '#khaf/utility/commands/Cartoonize'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Cartoonize an image using AI.',
                '[attached image]'
            ],
            {
                name: 'cartoonize',
                folder: 'Utility',
                args: [0, 0],
                aliases: ['cartoon'],
                guildOnly: true,
                ratelimit: 30
            }
        )
    }

    async init (message: Message): Promise<APIEmbed> {
        if (message.attachments.size === 0)
            return Embed.error('No image was attached!')

        void message.channel.sendTyping()

        const cartoon = await Cartoonize.cartoonize(message.attachments.first()!)
        if (!cartoon)
            return Embed.error('Failed to extract the image from the HTML. 😕')

        return Embed.json({
            color: colors.ok,
            description: `[Click Here](${cartoon}) to download!`,
            image: { url: cartoon }
        })
    }
}
