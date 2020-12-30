import { Message } from 'discord.js';
import { Command } from '../../../Structures/Command.js';
import { thisSimpsonDoesNotExist } from '../../../lib/Backend/Simpson.js';

// this is not handled the same way the other this[x]doesnotexist commands.

export default class extends Command {
    constructor() {
        super(
            [
                'This fucked up Homer does not exist!',
                ''
            ],
			{
                name: 'thisfuckeduphomerdoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thishomerdoesnotexist', 'tfuhdne' ]
            }
        );
    }

    async init(message: Message) {
        let homer: string | null = null;
        try {
            homer = await thisSimpsonDoesNotExist();
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server failed to process the request!'));
            } 

            return message.reply(this.Embed.fail(`An unexpected ${e.name} occurred!`));
        }

        return message.reply(this.Embed.success().setImage(homer));
    }
}