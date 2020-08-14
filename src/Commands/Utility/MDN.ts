import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { mdn } from "../../lib/Backend/MDNHandler";
import Embed from "../../Structures/Embed";
import { compareTwoStrings } from "../../lib/Utility/CompareStrings";
import { MDNSearch } from "../../lib/types/MDN";

export default class extends Command {
    constructor() {
        super(
            { name: 'mdn', folder: 'Utility' },
            [
                'Search MDN for a phrase.',
                'Array.prototype.slice',
                'Number toLocaleString'
            ],
            [ /* No extra perms needed */],
            20
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 1) { // mdn Array.prototype.slice
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        let results: MDNSearch;
        try {
            results = await mdn(args.join(' '));
        } catch {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }

        const best = results.documents
            .map(doc => Object.assign(doc, { 
                diff: compareTwoStrings(args.join(' ').toLowerCase(), doc.title.toLowerCase()) 
            }))
            .sort((a, b) => b.diff - a.diff);

        const embed = Embed.success()
            .setAuthor('Mozilla Development Network', 'https://developer.mozilla.org/static/img/opengraph-logo.72382e605ce3.png')
            .setDescription(best.map(doc => `[${doc.title}](https://developer.mozilla.org/${doc.locale}/docs/${doc.slug})`))
            .setFooter('Requested by ' + message.author.tag)
            .setTimestamp()

        return message.channel.send(embed);
    }
}