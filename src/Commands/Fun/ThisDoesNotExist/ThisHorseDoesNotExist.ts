import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { thisDoesNotExist } from '../../../lib/Backend/ThisDoesNotExist.js';

export default class extends Command {
    constructor() {
        super(
            [
                'This horse does not exist!',
                ''
            ],
			{
                name: 'thishorsedoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thishorsedoesn\'texist', 'thdne' ]
            }
        );
    }

    async init(message: Message) {
        const embed = await thisDoesNotExist('horse');
        return message.reply(embed);
    }
}