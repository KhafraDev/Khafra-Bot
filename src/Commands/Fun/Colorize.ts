import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { URL } from 'url';
import { colorPhoto } from '../../lib/Backend/Colorize.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Colorize a black-and-white photo using Algorithmia!',
                'https://nikonrumors.com/wp-content/uploads/2016/08/verbruci_iceland_blackandwhite_5.jpg'
            ],
            {
                name: 'colorize',
                folder: 'Fun',
                args: [1, 1]
            }
        )
    }

    async init(message: Message, args: string[]) {
        let url: URL | null = null;
        try {
            url = new URL(args.shift());
        } catch {
            return message.reply(this.Embed.generic('Invalid image URL!'));
        }

        message.channel.startTyping();
        let photoURL: string | null = null;
        try {
            photoURL = await colorPhoto(url);
        } catch(e) {
            message.channel.stopTyping();
            if(e.name === 'AlgorithmiaError') {
                return message.reply(this.Embed.fail(`
                A server error occurred:
                \`\`${e.toString()}\`\`
                `));
            } else if(e.name === 'AssertionError') {
                return message.reply(this.Embed.fail('Invalid response received from server!'));
            }

            return message.reply(this.Embed.fail('An unknown error occurred!'));
        }

        message.channel.stopTyping();
        return message.reply(this.Embed.success().setImage(photoURL));
    }
}