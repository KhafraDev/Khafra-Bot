import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { talkObamaToMe } from '../../lib/Backend/TalkObamaToMe.js';
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
                args: [1]
            }
        );
    }

    async init(_message: Message, args: string[]) {
        const obama = await talkObamaToMe(args.join(' ').slice(0, 280));

        if (!obama) {
            return this.Embed.fail('Server never sent URL.');
        }

        return this.Embed.success(obama);
    }
}