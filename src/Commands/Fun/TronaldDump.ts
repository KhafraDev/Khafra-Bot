import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { trumpQuote } from '../../lib/Backend/TronaldDump.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Get a Donald Trump quote from https://tronalddump.io',
                ''
            ],
			{
                name: 'dump',
                folder: 'Fun',
                aliases: [ 'tronald', 'tronalddump' ],
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        let quote;
        try {
            quote = await trumpQuote();
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server had an issue processing the request.'));
            } else if(e.name === 'AssertionError') {
                return message.reply(this.Embed.fail('Server responded with an error.'));
            }

            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        return message.reply(this.Embed.success(`
        \`\`\`${quote.value}\`\`\`
        [Source](${quote._embedded.source[0].url}).
        [TronaldDump.io](${quote._links.self.href}).
        `).setTimestamp(quote.appeared_at));
    }
}