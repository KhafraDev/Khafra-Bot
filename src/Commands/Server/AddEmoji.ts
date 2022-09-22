import { Command } from '#khaf/Command'
import { PermissionFlagsBits } from 'discord-api-types/v10'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Add an emoji to the server!',
                'my_emoji [image attachment]',
                'amogus https://cdn.discordapp.com/emojis/812093828978311219.png?v=1',
                'https://cdn.discordapp.com/emojis/812093828978311219.png?v=1 amogus'
            ],
            {
                name: 'addemoji',
                folder: 'Server',
                args: [1, 2],
                guildOnly: true,
                permissions: [PermissionFlagsBits.ManageEmojisAndStickers]
            }
        )
    }

    async init (): Promise<void> {}
}