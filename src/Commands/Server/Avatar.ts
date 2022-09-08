import { Command, type Arguments } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { getMentions } from '#khaf/utility/Mentions.js'
import type { ImageExtension, ImageSize, ImageURLOptions } from '@discordjs/rest'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { parseArgs } from 'node:util'

const avatarSizes: ImageSize[] = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096]
const avatarFormats: ImageExtension[] = ['webp', 'png', 'jpg', 'jpeg', 'gif']

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get someone\'s avatar!',
                '',
                '@Khafra#0001',
                '267774648622645249',
                '@Khafra#0001 --size 256 --format jpg',
                '@Khafra#0001 -s 256 -f gif'
            ],
            {
                name: 'avatar',
                folder: 'Server',
                args: [0, 5],
                aliases: ['av', 'a'],
                ratelimit: 3
            }
        )
    }

    async init (message: Message, { content, args }: Arguments): Promise<APIEmbed> {
        const user = await getMentions(message, 'users', content) ?? message.author
        const { values: cli } = parseArgs({
            args,
            options: {
                size: {
                    type: 'string',
                    short: 's'
                },
                format: {
                    type: 'string',
                    short: 'f'
                }
            }
        })

        const opts: ImageURLOptions = {
            size: 512,
            extension: 'png',
            forceStatic: false
        }

        if (cli['size'] !== undefined) {
            const value = Number(cli['size']) as ImageSize
            if (avatarSizes.includes(value)) {
                opts.size = value
            }
        }

        if (cli['format'] !== undefined) {
            const value = cli['format'] as ImageExtension
            if (typeof value === 'string' && avatarFormats.includes(value)) {
                opts.extension = value
            }
        }

        return Embed.json({
            color: colors.ok,
            description: `${user}'s avatar`,
            image: { url: user.displayAvatarURL(opts) }
        })
    }
}