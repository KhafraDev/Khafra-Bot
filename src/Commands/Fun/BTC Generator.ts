import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { delay } from '../../lib/Utility/Constants/OneLiners.js';
import { Range } from '../../lib/Utility/Valid/Number.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

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

        const embed = this.Embed.success()
            .setTitle(`Generating ${btc.toLocaleString()} BTC!`)
            .setImage('https://i.imgur.com/8sIZySU.gif');

        const msg = await message.reply({ embeds: [embed] });
        
        await delay(Math.floor(Math.random() * (10000 - 2500 + 1) + 2500));

        const embed2 = this.Embed.success()
            .setTitle(`Generated ${btc.toLocaleString()} BTC!`);

        return void dontThrow(msg.edit({ embeds: [embed2] }));
    }
}