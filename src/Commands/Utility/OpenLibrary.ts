import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { openLibrary } from '#khaf/utility/commands/Openlibrary';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { bold, hyperlink, inlineCode, italic, type UnsafeEmbedBuilder } from '@discordjs/builders';
import type { Message } from 'discord.js';

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Open Library is an open, editable library catalog, building towards a web page for every book ever published.\n\n' +
                'https://openlibrary.org/about',
                'The Great Gatsby'
            ],
            {
                name: 'openlibrary',
                folder: 'Utility',
                args: [1],
                aliases: ['library', 'book', 'books']
            }
        );
    }

    async init (_message: Message, { args }: Arguments): Promise<UnsafeEmbedBuilder> {
        const books = await openLibrary(args.join(' '));

        if (books.numFound === 0 || books.docs.length === 0) {
            return Embed.error('No books found on OpenLibrary!');
        }

        const book = books.docs.shift()!;
        const description = `
        ${italic(book.title)} by ${book.author_name.join(' and ')}
        Published in ${book.first_publish_year}
        ${Array.isArray(book.isbn) && book.isbn.length > 0 ? `ISBN: ${inlineCode(book.isbn[0])}` : ''}

        [Download (PDF)](https://archive.org/download/${book.ia[0]}/${book.ia[0]}.pdf)
        [OpenLibrary](https://openlibrary.org${book.key}/)
        ${book.id_amazon?.[0] ? `[Amazon](https://www.amazon.com/dp/${book.id_amazon[0]}/)` : ''}
        ${book.id_goodreads?.[0] ? `[GoodReads](https://www.goodreads.com/book/show/${book.id_goodreads[0]})` : ''}
        ${book.id_google?.[0] ? `[Google Books](https://books.google.com/books?id=${book.id_google[0]})` : ''}
        
        ${bold(hyperlink('Donate to the Internet Archive', 'https://archive.org/donate/'))}
        `.trim();

        return Embed.ok().setDescription(description.replace(/^(\s*\r?\n){2,}/gm, '\n'));
    }
}
