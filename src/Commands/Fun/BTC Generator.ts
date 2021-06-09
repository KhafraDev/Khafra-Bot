import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { delay } from '../../lib/Utility/Constants/OneLiners.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { Range } from '../../lib/Utility/Range.js';
import { validateNumber } from '../../lib/Utility/Valid/Number.js';

const range = Range(0, Number.MAX_SAFE_INTEGER);

@RegisterCommand
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
        const btc = range.isInRange(num) && validateNumber(num) ? num : 1000;

        const embed = this.Embed.success()
            .setTitle(`Generating ${btc.toLocaleString()} BTC!`)
            .setImage('https://i.imgur.com/8sIZySU.gif');

        const msg = await message.reply({ embed });
        
        await delay(Math.floor(Math.random() * (10000 - 2500 + 1) + 2500));

        if (msg.deleted) return;

        const embed2 = this.Embed.success()
            .setTitle(`Generated ${btc.toLocaleString()} BTC!`);

        return void msg.edit({ embed: embed2 });
    }
}