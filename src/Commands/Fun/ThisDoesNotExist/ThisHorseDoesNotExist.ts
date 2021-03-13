import { Command } from '../../../Structures/Command.js';
import { thisDoesNotExist } from '../../../lib/Backend/ThisDoesNotExist.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'This horse does not exist!'
            ],
			{
                name: 'thishorsedoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thishorsedoesn\'texist', 'thdne' ]
            }
        );
    }

    async init() {
        return await thisDoesNotExist('horse');
    }
}