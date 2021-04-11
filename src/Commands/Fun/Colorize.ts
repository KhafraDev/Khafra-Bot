import { Message } from 'discord.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { URL } from 'node:url';
import { colorPhoto } from '../../lib/Backend/Colorize.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Colorize a black-and-white photo using Algorithmia!',
                'https://nikonrumors.com/wp-content/uploads/2016/08/verbruci_iceland_blackandwhite_5.jpg'
            ],
            {
                name: 'colorize',
                folder: 'Fun',
                args: [1, 1],
                ratelimit: 30,
                errors: {
                    TypeError: 'Invalid image URL!',
                    AlgorithmiaError: 'A server error occurred!',
                    AssertionError: 'Invalid response received from server!'
                }
            }
        )
    }

    async init(_message: Message, { args }: Arguments) {
        const url = new URL(args.shift());
        const photoURL = await colorPhoto(url);

        return this.Embed.success().setImage(photoURL);
    }
}