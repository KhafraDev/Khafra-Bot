import { Command } from '#khaf/Command';
import { thisDoesNotExist } from '#khaf/utility/commands/ThisDoesNotExist';

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
                ratelimit: 7,
                aliases: [ 'thispersondoesn\'texist', 'tpdne' ]
            }
        );
    }

    async init() {
        return await thisDoesNotExist('person');
    }
}