import { Command } from '../../../Structures/Command.js';
import { thisDoesNotExist } from '../../../lib/Backend/ThisDoesNotExist.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'This person does not exist!'
            ],
			{
                name: 'thispersondoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thispersondoesn\'texist', 'tpdne' ]
            }
        );
    }

    async init() {
        return await thisDoesNotExist('person');
    }
}