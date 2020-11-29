import { Message } from 'discord.js';
import { Command } from "../../Structures/Command.js";
import { talkObamaToMe } from '../../lib/Backend/TalkObamaToMe.js';

export default class extends Command {
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

    async init(message: Message, args: string[]) {
        let obama;
        try {
            obama = await talkObamaToMe(args.join(' ').slice(0, 280));
        } catch(e) {
            if(e.name === 'AssertionError') {
                return message.reply(this.Embed.fail('Received bad response from server!'));
            }

            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        if(!obama) {
            return message.reply(this.Embed.fail('Server never sent URL.'));
        }

        return message.reply(this.Embed.success(obama));
    }
}