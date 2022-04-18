import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { type UnsafeEmbedBuilder } from '@discordjs/builders';
import { fetchMDN as mdn } from '@khaf/mdn';
import type { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Search MDN for a phrase.',
                'Array.prototype.slice',
                'Number toLocaleString'
            ],
            {
                name: 'mdn',
                folder: 'Utility',
                args: [1]
            }
        );
    }

    async init (message: Message, { args }: Arguments): Promise<UnsafeEmbedBuilder> {
        const results = await mdn(args.join(' '));

        if ('errors' in results) {
            const keys = Object.keys(results.errors);
            return Embed.error(
                // gets all errors and types of errors and joins them together.
                keys.map(k => results.errors[k].map(e => e.message).join('\n')).join('\n')
            );
        }

        if (results.documents.length === 0)
            return Embed.error('No results found!');

        const best = results.documents.sort((a, b) => b.score - a.score);

        return Embed.ok()
            .setAuthor({
                name: 'Mozilla Development Network',
                iconURL: 'https://developer.mozilla.org/static/img/opengraph-logo.png'
            })
            .setDescription(best.map(doc =>
                `[${doc.title}](https://developer.mozilla.org/${doc.locale}/docs/${doc.slug})`)
                .join('\n')
            )
            .setFooter({ text: 'Requested by ' + message.author.tag })
            .setTimestamp();
    }
}