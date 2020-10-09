import { Command } from "../../Structures/Command";
import { Message } from "discord.js";


export default class extends Command {
    constructor() {
        super(
            [
                'Generate free BTC!',
                '1000',
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'btc-generator',
                folder: 'Fun',
                aliases: [ 'btcgenerator', 'free-btc', 'freebtc', 'btcgenerate' ],
                args: [1, 1]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const btc = !isNaN(+args[0]) ? +args[0] : 1000;
        const embed = this.Embed.success()
            .setTitle(`Generating ${btc.toLocaleString()} BTC!`)
            .setImage('https://i.imgur.com/8sIZySU.gif');

        const msg = await message.channel.send(embed);
        if(!msg) {
            return;
        }
        
        setTimeout(() => {
            if(msg.deleted) {
                return;
            }

            const embed = this.Embed.success()
                .setTitle(`Generated ${btc.toLocaleString()} BTC!`);

            return msg.edit(embed);
        }, Math.random() * (10000 - 2500 + 1) + 2500 << 0);
    }
}