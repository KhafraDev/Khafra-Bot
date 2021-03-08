import { Command } from '../../Structures/Command.js';
import { trumpQuote } from '../../lib/Backend/TronaldDump.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a Donald Trump quote from https://tronalddump.io'
            ],
			{
                name: 'dump',
                folder: 'Fun',
                aliases: [ 'tronald', 'tronalddump' ],
                args: [0, 0]
            }
        );
    }

    async init() {
        const quote = await trumpQuote();

        return this.Embed.success(`
        \`\`\`${quote.value}\`\`\`
        [Source](${quote._embedded.source[0].url}).
        [TronaldDump.io](${quote._links.self.href}).
        `).setTimestamp(quote.appeared_at);
    }
}