import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { mdn } from "../../lib/Backend/MDN/MDNHandler.js";
import { compareTwoStrings } from "../../lib/Utility/CompareStrings.js";
import { MDNSearch } from "../../lib/Backend/MDN/types/MDN";

export default class extends Command {
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
        let results: MDNSearch;
        try {
            results = await mdn(args.join(' '));
        } catch {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        const best = results.documents
            .map(doc => Object.assign(doc, { 
                diff: compareTwoStrings(args.join(' ').toLowerCase(), doc.title.toLowerCase()) 
            }))
            .sort((a, b) => b.diff - a.diff);

        const embed = this.Embed.success()
            .setAuthor('Mozilla Development Network', 'https://developer.mozilla.org/static/img/opengraph-logo.72382e605ce3.png')
            .setDescription(best.map(doc => `[${doc.title}](https://developer.mozilla.org/${doc.locale}/docs/${doc.slug})`))
            .setFooter('Requested by ' + message.author.tag)
            .setTimestamp()

        return message.reply(embed);
    }
}