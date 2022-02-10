import { Arguments, Command } from '#khaf/Command';
import { talkObamaToMe } from '#khaf/utility/commands/TalkObamaToMe';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { inlineCode, type Embed } from '@khaf/builders';
import { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
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

    async init (_message: Message, { args }: Arguments): Promise<string | Embed> {
        const [barack, obama] = await dontThrow(talkObamaToMe(args.join(' ').slice(0, 280)));

        if (barack !== null) {
            return this.Embed.error(`An unexpected error occurred: ${inlineCode(barack.message)}`);
        }

        return obama;
    }
}