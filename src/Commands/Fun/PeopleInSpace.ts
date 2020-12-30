import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { fetchPeopleInSpace } from '../../lib/Backend/PeopleInSpace.js';

export default class extends Command {
    constructor() {
        super(
            [
                'How many people are in space right now?',
                ''
            ],
			{
                name: 'spacern',
                folder: 'Fun',
                aliases: [ 'hmpaisrn', 'inspace', 'howmanypeopleareinspacerightnow' ], 
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        let spacern;
        try {
            spacern = await fetchPeopleInSpace();
        } catch {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        return message.reply(this.Embed.success(`
        ${spacern.number} people.
        ${spacern.people
            .map(p => `${p.name}, ${Math.floor((Date.now() - new Date(p.launchdate).getTime()) / 86400000)} days`)
            .join('\n')
        }
        [Click Here](http://howmanypeopleareinspacerightnow.com)!
        `));
    }
}