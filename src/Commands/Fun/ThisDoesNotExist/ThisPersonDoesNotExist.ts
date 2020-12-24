import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { thisDoesNotExist } from '../../../lib/Backend/ThisDoesNotExist.js';

export default class extends Command {
    constructor() {
        super(
            [
                'This person does not exist!',
                ''
            ],
			{
                name: 'thispersondoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thispersondoesn\'texist', 'tpdne' ]
            }
        );
    }

    async init(message: Message) {
        const embed = await thisDoesNotExist('person');
        return message.reply(embed);
    }
}