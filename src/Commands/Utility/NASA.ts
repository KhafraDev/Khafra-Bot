import { Command } from '#khaf/Command'

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

    async init (): Promise<void> {}
}