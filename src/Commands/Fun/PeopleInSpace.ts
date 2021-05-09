import { Command } from '../../Structures/Command.js';
import { fetchPeopleInSpace } from '../../lib/Packages/PeopleInSpace.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'How many people are in space right now?'
            ],
			{
                name: 'spacern',
                folder: 'Fun',
                aliases: [ 'hmpaisrn', 'inspace', 'howmanypeopleareinspacerightnow' ], 
                args: [0, 0]
            }
        );
    }

    async init() {
        const spacern = await fetchPeopleInSpace();

        return this.Embed.success(`
        ${spacern.number} people.
        ${spacern.people
            .map(p => `${p.name}, ${Math.floor((Date.now() - new Date(p.launchdate).getTime()) / 86400000)} days`)
            .join('\n')
        }
        [Click Here](http://howmanypeopleareinspacerightnow.com)!
        `);
    }
}