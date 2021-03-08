import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { fetchMDN as mdn } from 'search-mdn';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Search MDN for a phrase.',
                'Array.prototype.slice',
                'Number toLocaleString'
            ],
			{
                name: 'mdn',
                folder: 'Utility',
                args: [1],
            }
        );
    }

    async init(message: Message, args: string[]) {
        const results = await mdn(args.join(' '));

        if ('errors' in results) {
            const keys = Object.keys(results.errors);
            return this.Embed.fail(
                // gets all errors and types of errors and joins them together.
                keys.map(k => results.errors[k].map(e => e.message).join('\n')).join('\n')
            );
        }

        if (results.documents.length === 0)
            return this.Embed.fail('No results found!');
        
        const best = results.documents.sort((a, b) => b.score - a.score);

        return this.Embed.success()
            .setAuthor('Mozilla Development Network', 'https://developer.mozilla.org/static/img/opengraph-logo.png')
            .setDescription(best.map(doc => `[${doc.title}](https://developer.mozilla.org/${doc.locale}/docs/${doc.slug})`).join('\n'))
            .setFooter('Requested by ' + message.author.tag)
            .setTimestamp();
    }
}