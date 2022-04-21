import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Buttons, Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import type { APIEmbed } from 'discord-api-types/v10';
import type { Message } from 'discord.js';

type ComponentTypes = Exclude<keyof typeof Buttons, 'link'>

const inRange = Range({ min: 1, max: 5, inclusive: true });

export class kCommand extends Command {
    constructor () {
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

    async init (message: Message, { args }: Arguments): Promise<undefined | APIEmbed> {
        const amount = Number(args[0]);
        if (!inRange(amount))
            return Embed.error('Invalid number of buttons to add!');

        const row = Components.actionRow();
        const keys = Object.keys(Buttons) as ComponentTypes[];
        keys.splice(keys.findIndex(i => `${i}` === 'link'), 1);

        for (let i = 0; i < amount; i++) {
            const type = keys[Math.floor(Math.random() * keys.length)];
            const disabled = Boolean(Math.round(Math.random()));
            const button = Buttons[type](type);
            button.disabled = disabled;

            row.components.push(button);
        }

        await message.reply({
            content: 'Debug message!',
            components: [row]
        });
    }
}