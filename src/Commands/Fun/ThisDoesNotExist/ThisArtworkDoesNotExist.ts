import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { thisDoesNotExist } from '../../../lib/Backend/ThisDoesNotExist.js';

export default class extends Command {
    constructor() {
        super(
            [
                'This artwork does not exist!',
                ''
            ],
			{
                name: 'thisartworkdoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thisartworkdoesn\'texist', 'tadne', 'thisartdoesnotexist', 'thisartdoesn\'texist' ]
            }
        );
    }

    async init(message: Message) {
        const embed = await thisDoesNotExist('artwork');
        return message.reply(embed);
    }
}