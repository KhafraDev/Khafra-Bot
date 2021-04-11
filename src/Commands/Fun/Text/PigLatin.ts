import { Command, Arguments } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { pigLatin } from '../../../lib/Backend/PigLatin.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Convert English to Pig Latin!',
                'To make pure ice, you freeze water. Oak is strong and also gives shade.'
            ],
			{
                name: 'piglatin',
                folder: 'Fun',
                args: [1],
                ratelimit: 3
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        const pig = pigLatin(args.join(' '));
        return this.Embed.success(pig.slice(0, 2048))
    }
}