import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { Wikipedia } from "../../lib/Backend/Wikipedia/Wikipedia";
import { AllHtmlEntities } from "html-entities";
import { WikipediaSearch } from "../../lib/Backend/Wikipedia/types/Wikipedia";

const all = new AllHtmlEntities();

export default class extends Command {
    constructor() {
        super(
            [
                'Search Wikipedia for an article!',
                'Jupiter', 'Green Day'
            ],
            [ /* No extra perms needed */ ], {
                name: 'wikipedia',
                folder: 'Utility',
                args: [1],
                aliases: [ 'wiki' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length === 0) {
            return message.channel.send(this.Embed.generic());
        }

        let wiki = await Wikipedia(args.join(' '));
        if('method' in wiki) { // WikipediaArticleNotFound
            wiki = await Wikipedia(args.join(' '), 'en', 1); // force search
        }
        
        if('error' in wiki) { // WikipediaError
            return message.channel.send(this.Embed.fail(`
            Received status ${wiki.httpCode} (${wiki.httpReason}).
            `));
        } 
        
        if('extract' in wiki) {
            const embed = this.Embed.success(`
            ${wiki.content_urls.desktop?.page.slice(0, 140)}

            ${wiki.extract?.slice(0, 1900)}
            `)
                .setTitle(wiki.title)
                .setThumbnail(wiki.originalimage?.source ?? wiki.thumbnail?.source ?? 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Khafra.jpg/800px-Khafra.jpg')
                .setTimestamp(new Date(wiki.timestamp ?? Date.now()))
                .setFooter('Last updated');

            return message.channel.send(embed);
        }
        
        wiki = wiki as WikipediaSearch; // can't be WikipediaArticleNotFound
        if(wiki.pages.length === 0) {
            return message.channel.send(this.Embed.fail(`No results found!`));
        }

        const embed = this.Embed.success(all.decode(wiki.pages[0].excerpt.replace(/<[^>]*>?/gm, '').slice(0, 2048)))
            .setTitle(wiki.pages[0].title)
            .setThumbnail(wiki.pages[0].thumbnail?.url ? 'https:' + wiki.pages[0].thumbnail?.url : null);

        return message.channel.send(embed);
    }
}