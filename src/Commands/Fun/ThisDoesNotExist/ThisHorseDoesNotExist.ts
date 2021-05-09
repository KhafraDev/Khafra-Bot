import { Command } from '../../../Structures/Command.js';
import { thisDoesNotExist } from '../../../lib/Packages/ThisDoesNotExist.js';
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
                ratelimit: 7,
                aliases: [ 'thishorsedoesn\'texist', 'thdne' ]
            }
        );
    }

    async init() {
        return await thisDoesNotExist('horse');
    }
}