import { Command } from '../../../Structures/Command.js';
import { thisDoesNotExist } from '../../../lib/Packages/ThisDoesNotExist.js';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'This artwork does not exist!'
            ],
			{
                name: 'thisartworkdoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                ratelimit: 7,
                aliases: [ 'thisartworkdoesn\'texist', 'tadne', 'thisartdoesnotexist', 'thisartdoesn\'texist' ]
            }
        );
    }

    async init() {
        return await thisDoesNotExist('artwork');
    }
}