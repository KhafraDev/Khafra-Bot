import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            [
                'Generate free BTC!',
                '1000 3D9zJxaESUJB2s79LNVLHRgKoADQtAJ6aq',
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'btc-generator',
                folder: 'Fun',
                cooldown: 10,
                aliases: [ 'btcgenerator', 'free-btc', 'freebtc', 'btcgenerate' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length !== 2) {
            return message.channel.send(Embed.missing_args.call(this, 2));
        }

        const embed = Embed.success()
            .setTitle(`Generating ${!isNaN(+args[0]) ? args[0] : '1000'} BTC!`)
            .setImage('https://i.imgur.com/8sIZySU.gif');

        const msg = await message.channel.send(embed);

        setTimeout(() => {
            if(msg.deleted) {
                return;
            }

            const embed = Embed.success()
                .setTitle(`Generated ${isNaN(+args[0]) ? args[0] : '1000'} BTC!`)
                .setDescription('Sending the BTC to ' + args[1] + ' now!');

            return msg.edit(embed);
        }, Math.random() * (10000 - 2500 + 1) + 2500 << 0);
    }
}