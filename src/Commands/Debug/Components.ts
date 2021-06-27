import { Arguments, Command } from '../../Structures/Command.js';
import { Message, MessageActionRow } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { validateNumber } from '../../lib/Utility/Valid/Number.js';
import { Range } from '../../lib/Utility/Range.js';
import { Components } from '../../lib/Utility/Constants/Components.js';

const range = Range(1, 5, true);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Send a message with a given number of random buttons attached.',
                '1', '5'
            ],
            {
                name: 'debug:components',
                folder: 'Debug',
                args: [1, 1],
                aliases: ['debug:buttons', 'debug:button'],
                ratelimit: 3
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const amount = Number(args[0]);
        if (!validateNumber(amount) || !range.isInRange(amount))
            return this.Embed.fail(`Invalid number of buttons to add!`);

        const row = new MessageActionRow();
        const keys = Object.keys(Components) as (keyof typeof Components)[];
        for (let i = 0; i < amount; i++) {
            const type = keys[Math.floor(Math.random() * keys.length)];
            const disabled = Boolean(Math.round(Math.random()));
            row.addComponents(Components[type](type).setDisabled(disabled));
        }

        await message.reply({
            content: 'Debug message!',
            components: [row]
        });
    }
}