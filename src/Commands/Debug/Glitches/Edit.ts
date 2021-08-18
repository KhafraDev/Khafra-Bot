import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

const symbol = String.fromCodePoint(Number.parseInt('202B', 16));
const clean = 'The edit button won\'t be where you expect it to be!';
const edited = `The edit button is right there -> ${symbol} !Over here ->`;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Place an edit button in the middle of a message!'
            ],
            {
                name: 'hacks:edit',
                folder: 'Debug',
                args: [0, 0],
                ratelimit: 3
            }
        );
    }

    async init(message: Message) {
        const m = await message.reply({ content: clean });

        if (m.editable) {
            return m.edit({ content: edited });
        } else {
            return this.Embed.fail(`Message wasn't editable!`);
        }
    }
}
