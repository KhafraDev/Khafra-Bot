import type { Arguments } from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Embed, EmbedUtil } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import type { Message } from 'discord.js';
import { setTimeout } from 'node:timers/promises';

const inRange = Range({ min: 0, max: Number.MAX_SAFE_INTEGER });

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Generate free BTC!',
                '1000'
            ],
            {
                name: 'btc-generator',
                folder: 'Fun',
                aliases: ['btcgenerator', 'free-btc', 'freebtc', 'btcgenerate'],
                args: [1, 1]
            }
        );
    }

    async init (message: Message, { args }: Arguments): Promise<void> {
        const num = Number(args[0]);
        const btc = inRange(num) ? num : 1000;

        const embed = Embed.ok();
        EmbedUtil.setTitle(embed, `Generating ${btc.toLocaleString()} BTC!`);
        EmbedUtil.setImage(embed, { url: 'https://i.imgur.com/8sIZySU.gif' });

        const msg = await message.reply({ embeds: [embed] });

        await setTimeout(
            Math.floor(Math.random() * (10000 - 2500 + 1) + 2500),
            undefined,
            { ref: false }
        );

        const embed2 = EmbedUtil.setTitle(
            Embed.ok(),
            `Generated ${btc.toLocaleString()} BTC!`
        );

        return void dontThrow(msg.edit({ embeds: [embed2] }));
    }
}