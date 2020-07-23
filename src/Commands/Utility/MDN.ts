import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { get } from 'https';
import Embed from "../../Structures/Embed";

type mdnResult = { partialURL: string, title: string, diff: number }

/**
 * Compare similarity between 2 strings using Dice's coefficient. 
 * Case sensitive - ``abc`` isn't ``AbC`` in my opinion.
 * @see https://en.wikipedia.org/wiki/S%C3%B8rensen%E2%80%93Dice_coefficient
 * @author Khafra
 * @param X first string
 * @param Y second string
 * @returns {number} "quotient of similarity" (number 0-1).
 */
const compareTwoStrings = (X: string, Y: string): number => {
    const bigramsX = Array.from(
        Array(X.length - 1),
        (_, index) => X[index] + X[index + 1]
    );

    const bigramsY = Array.from(
        Array(Y.length - 1),
        (_, index) => Y[index] + Y[index + 1]
    );

    const inBoth = bigramsX.filter(current => bigramsY.indexOf(current) > -1);
    return (2 * inBoth.length) / (bigramsX.length + bigramsY.length);
}

export default class extends Command {
    constructor() {
        super(
            'mdn',
            'MDN Results',
            [ /* No extra perms needed */],
            20
        );
    }

    async init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        } else if(args.length < 1) { // mdn Array.prototype.slice
            return message.channel.send(Embed.missing_args(1, this.name, [
                'Array.prototype.slice',
                'Number toLocaleString'
            ]));
        }

        let parsed: mdnResult[] = [];
        try {
            const html = await this.mdn(args.join(' '));
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
     * Get the search result page's HTML
     * @param q query
     */
    mdn(q: string): Promise<any> {
        q = encodeURIComponent(q.replace(' ', '+'))

        return new Promise((resolve, reject) => {
            get('https://developer.mozilla.org/en-US/search?q=' + q, res => {
                if(res.statusCode !== 200) {
                    return reject(new Error('Non-200 status code'));
                }
    
                const body = [];
                res.on('data', d => body.push(d));
                res.on('end', () => resolve(body.join(' ')));
            }).on('error', e => reject(e));
        });
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