import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import type { MessageActionRowComponentBuilder} from '@discordjs/builders';
import { ActionRowBuilder, type UnsafeEmbedBuilder } from '@discordjs/builders';
import type { Message } from 'discord.js';

type ComponentTypes = Exclude<keyof typeof Components, 'link'>

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

    async init (message: Message, { args }: Arguments): Promise<UnsafeEmbedBuilder | undefined> {
        const amount = Number(args[0]);
        if (!inRange(amount))
            return Embed.error('Invalid number of buttons to add!');

        const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();
        const keys = Object.keys(Components) as ComponentTypes[];
        keys.splice(keys.findIndex(i => `${i}` === 'link'), 1);

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