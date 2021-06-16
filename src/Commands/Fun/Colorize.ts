import { Message } from 'discord.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { colorPhoto } from '../../lib/Packages/Colorize.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { URLFactory } from '../../lib/Utility/Valid/URL.js';

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
        const url = URLFactory(args[0]);
        if (url === null)
            return this.Embed.fail('Not a valid link to an image!');
        const photoURL = await colorPhoto(url);

        return this.Embed.success().setImage(photoURL);
    }
}