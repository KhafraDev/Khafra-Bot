import { Command } from '#khaf/Command';
import { thisDoesNotExist } from '#khaf/utility/commands/ThisDoesNotExist';

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