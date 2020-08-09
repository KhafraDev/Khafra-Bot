import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { mdn } from "../../Backend/CommandStructures/MDNHandler";
import Embed from "../../Structures/Embed";
import { compareTwoStrings } from "../../Backend/Utility/CompareStrings";

type mdnResult = { partialURL: string, title: string, diff: number }

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
            return message.channel.send(Embed.missing_args(1, this.name.name, this.help.slice(1)));
        }

        let parsed: mdnResult[] = [];
        try {
            const html = await mdn(args.join(' '));
            parsed = this.parseHTML(html, args.join(' '));
        } catch {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }

        const embed = Embed.success()
            .setAuthor('Mozilla Development Network', 'https://developer.mozilla.org/static/img/opengraph-logo.72382e605ce3.png')
            .setDescription(parsed.map(res => `[${res.title}](https://developer.mozilla.org${res.partialURL})`).join('\n'))
            .setFooter('Requested by ' + message.author.tag)
            .setTimestamp()

        return message.channel.send(embed);
    }

    /**
     * Parse the page's HTML
     * @param html html
     */
    parseHTML(html: string, search: string): mdnResult[] {
        const c = html.match(/<a class="result-title" href="(.*?)">(.*?)<\/a>/g);
        const b = [];
        for(const u of c) {
            const [, partialURL, title] = u.match(/href="(.*?)">(.*?)<\/a>/);
            b.push({
                partialURL,
                title,
                diff: compareTwoStrings(search.toLowerCase(), title.toLowerCase())
            });
        }
        
        return b.sort((a, b) => b.diff - a.diff);
    }
}