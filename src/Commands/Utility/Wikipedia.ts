import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { Wikipedia } from '../../lib/Backend/Wikipedia/Wikipedia.js';
import entities from 'entities'; // cjs module
import { WikipediaSearch } from '../../lib/Backend/Wikipedia/types/Wikipedia';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Search Wikipedia for an article!',
                'Jupiter', 'Green Day'
            ],
			{
                name: 'wikipedia',
                folder: 'Utility',
                args: [1],
                aliases: [ 'wiki' ]
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        if (args.length === 0) {
            return this.Embed.generic(this);
        }

        let wiki = await Wikipedia(args.join(' '));
        if ('method' in wiki) { // WikipediaArticleNotFound
            wiki = await Wikipedia(args.join(' '), 'en', 1); // force search
        }
        
        if ('error' in wiki) { // WikipediaError
            return this.Embed.fail(`
            Received status ${wiki.httpCode} (${wiki.httpReason}).
            `);
        } 
        
        if ('extract' in wiki) {
            const embed = this.Embed.success(`
            ${wiki.content_urls.desktop?.page.slice(0, 140)}

            ${wiki.extract?.slice(0, 1900)}
            `)
                .setTitle(wiki.title)
                .setThumbnail(wiki.originalimage?.source ?? wiki.thumbnail?.source ?? 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Khafra.jpg/800px-Khafra.jpg')
                .setTimestamp(wiki.timestamp ?? Date.now())
                .setFooter('Last updated');

            return embed;
        }
        
        wiki = wiki as WikipediaSearch; // can't be WikipediaArticleNotFound
        if (wiki.pages.length === 0) {
            return this.Embed.fail(`No results found!`);
        }

        const embed = this.Embed.success(entities.decode(wiki.pages[0].excerpt.replace(/<[^>]*>?/gm, '').slice(0, 2048), 1))
            .setTitle(wiki.pages[0].title)
            .setThumbnail(wiki.pages[0].thumbnail?.url ? 'https:' + wiki.pages[0].thumbnail?.url : null);

        return embed;
    }
}