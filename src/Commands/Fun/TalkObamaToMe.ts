import { Message } from 'discord.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { talkObamaToMe } from '../../lib/Packages/TalkObamaToMe.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Have Obama say something to you.',
                'Khafra Bot is the best!'
            ],
			{
                name: 'talkobamatome',
                folder: 'Fun',
                aliases: [ 'totm' ], 
                args: [1],
                errors: {
                    FetchError: 'A server error occurred, try again later!',
                    // invalid URL
                    TypeError: 'Server replied with an invalid response, try again later!'
                }
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        const obama = await talkObamaToMe(args.join(' ').slice(0, 280));

        return obama;
    }
}