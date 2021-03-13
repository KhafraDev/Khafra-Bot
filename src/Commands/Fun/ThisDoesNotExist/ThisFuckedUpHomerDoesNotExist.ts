import { Command } from '../../../Structures/Command.js';
import { thisSimpsonDoesNotExist } from '../../../lib/Backend/Simpson.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

// this is not handled the same way the other this[x]doesnotexist commands.

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'This fucked up Homer does not exist!'
            ],
			{
                name: 'thisfuckeduphomerdoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thishomerdoesnotexist', 'tfuhdne' ]
            }
        );
    }

    async init() {
        const homer = await thisSimpsonDoesNotExist();

        return this.Embed.success().setImage(homer);
    }
}