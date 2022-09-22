import { Command } from '#khaf/Command'

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

    async init (): Promise<void> {}
}