import fetch from 'node-fetch';
import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { deepStrictEqual } from 'assert';

const getCheese = async () => {
    const res = await fetch('https://joebangles.co.uk/random', {
        redirect: 'manual'
    });
    return res.headers.get('Location');
}

export default class extends Command {
    constructor() {
        super(
            [
                'What is a random celebrity\'s favorite cheese?',
                ''
            ],
            {
                name: 'cheese',
                folder: 'Fun',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        let url: string;
        try {
            url = await getCheese();
            deepStrictEqual(typeof url, 'string');
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server had an issue processing the request.'));
            } else if(e.name === 'AssertionError') {
                return message.reply(this.Embed.fail('Server didn\'t give us a celebrity.'));
            }

            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        return message.channel.send(this.Embed.success(url));
    }
}