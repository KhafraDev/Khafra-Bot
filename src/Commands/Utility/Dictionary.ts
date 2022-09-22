import { Command } from '#khaf/Command'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Define a word!',
                'credit card', 'cat', 'juice'
            ],
            {
                name: 'define',
                folder: 'Utility',
                args: [1],
                aliases: ['definition', 'dict', 'dictionary']
            }
        )
    }

    async init (): Promise<void> {}
}