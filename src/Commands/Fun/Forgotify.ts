import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { forgotify } from '../../lib/Backend/Forgotify.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Listen to songs on Spotify that no one else has.',
                'Forgotify.com - "Millions of songs on Spotify have been forgotten."'
            ],
            {
                name: 'forgotify',
                folder: 'Fun',
                args: [0, 0]
            }
        )
    }

    async init(message: Message) {
        let song;
        try {
            song = await forgotify();
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail(`The server had an error processing the request.`));
            }

            return message.reply(this.Embed.fail(`An unknown ${e.name} occurred!`));
        }

        return message.reply(this.Embed.success(`[${song.title}](${song.url})`));
    }
}