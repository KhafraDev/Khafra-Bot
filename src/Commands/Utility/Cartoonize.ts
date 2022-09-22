import { Command } from '#khaf/Command'

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

    async init (): Promise<void> {}
}
