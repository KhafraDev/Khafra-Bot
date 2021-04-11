import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { isValidNumber } from '../../lib/Utility/Valid/Number.js';
import { delay } from '../../lib/Utility/Constants/OneLiners.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

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

    async init(message: Message, { args }: Arguments) {
        const btc = isValidNumber(+args[0]) ? +args[0] : 1000;
        const embed = this.Embed.success()
            .setTitle(`Generating ${btc.toLocaleString()} BTC!`)
            .setImage('https://i.imgur.com/8sIZySU.gif');

        const msg = await message.reply(embed);
        
        await delay(Math.floor(Math.random() * (10000 - 2500 + 1) + 2500));

        if (msg.deleted) return;

        const embed2 = this.Embed.success()
            .setTitle(`Generated ${btc.toLocaleString()} BTC!`);

        return msg.edit(embed2);
    }
}