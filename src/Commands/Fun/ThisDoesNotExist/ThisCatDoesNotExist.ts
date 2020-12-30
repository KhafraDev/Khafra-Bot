import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { thisDoesNotExist } from '../../../lib/Backend/ThisDoesNotExist.js';

export default class extends Command {
    constructor() {
        super(
            [
                'This cat does not exist!',
                ''
            ],
			{
                name: 'thiscatdoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thiscatdoesn\'texist', 'tcdne' ]
            }
        );
    }

    async init(message: Message) {
        const embed = await thisDoesNotExist('cat');
        return message.reply(embed);
    }
}