import { Command } from '#khaf/Command';
import { thisSimpsonDoesNotExist } from '#khaf/utility/commands/Simpson';

// this is not handled the same way the other this[x]doesnotexist commands.

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
                ratelimit: 7,
                aliases: [ 'thishomerdoesnotexist', 'tfuhdne' ]
            }
        );
    }

    async init() {
        const homer = await thisSimpsonDoesNotExist();

        return this.Embed.ok().setImage(homer);
    }
}