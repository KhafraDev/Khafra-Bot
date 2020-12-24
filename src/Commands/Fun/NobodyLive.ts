import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { nobodyLive } from '../../lib/Backend/NobodyLive.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Visit a Twitch streamer who has no viewers (https://nobody.live/)',
                ''
            ],
			{
                name: 'nobodylive',
                folder: 'Fun',
                aliases: ['nobody.live'],
                args: [0, 1]
            }
        );
    }

    async init(message: Message) {
        let stream;
        try {
            stream = await nobodyLive();
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server failed to respond!'));
            } else if(e.name === 'AssertionError') {
                return message.reply(this.Embed.fail('Unexpected results received from server!'));
            } else {
                return message.reply(this.Embed.fail('An unexpected error occurred!'));
            }
        }

        return message.reply(this.Embed
            .success(`${stream.url} - ${stream.title}`)
            .setImage(stream.thumbnail_url)
            .setFooter('https://nobody.live/')
        );
    }
}