import { Arguments, Command } from '#khaf/Command';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { Message } from 'discord.js';
import { setTimeout } from 'timers/promises';

const inRange = Range({ min: 0, max: Number.MAX_SAFE_INTEGER });

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Generate free BTC!',
                '1000',
            ],
			{
                name: 'btc-generator',
                folder: 'Fun',
                aliases: [ 'btcgenerator', 'free-btc', 'freebtc', 'btcgenerate' ],
                args: [1, 1]
            }
        );
    }

    async init(message: Message, { args }: Arguments): Promise<void> {
        const num = Number(args[0]);
        const btc = inRange(num) ? num : 1000;

        const embed = this.Embed.ok()
            .setTitle(`Generating ${btc.toLocaleString()} BTC!`)
            .setImage('https://i.imgur.com/8sIZySU.gif');

        const msg = await message.reply({ embeds: [embed] });
        
        await setTimeout(
            Math.floor(Math.random() * (10000 - 2500 + 1) + 2500),
            undefined,
            { ref: false }
        );

        const embed2 = this.Embed.ok()
            .setTitle(`Generated ${btc.toLocaleString()} BTC!`);

        return void dontThrow(msg.edit({ embeds: [embed2] }));
    }
}