import { Command } from '../../../Structures/Command.js';
import { thisDoesNotExist } from '../../../lib/Backend/ThisDoesNotExist.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'This cat does not exist!'
            ],
			{
                name: 'thiscatdoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                ratelimit: 7,
                aliases: [ 'thiscatdoesn\'texist', 'tcdne' ]
            }
        );
    }

    async init() {
        return await thisDoesNotExist('cat');
    }
}