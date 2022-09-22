import { Command } from '#khaf/Command'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'The classic CowSay command for Discord!',
                'head-in Help, I\'m stuck!', 'tux Global warming is a hoax', 'just your ordinary cow.', 'list'
            ],
            {
                name: 'cowsay',
                folder: 'Fun',
                args: [1],
                ratelimit: 3
            }
        )
    }

    async init (): Promise<void> {}
}