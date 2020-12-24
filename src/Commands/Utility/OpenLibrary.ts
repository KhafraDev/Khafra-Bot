import { Message } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { openLibrary } from '../../lib/Backend/Openlibrary.js';

export default class extends Command {
    constructor() {
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
                aliases: [ 'library', 'book', 'books' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        let books;
        try {
            books = await openLibrary(args.join(' '));
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server had an issue processing the request.'));
            } else if(e.name === 'AssertionError') {
                return message.reply(this.Embed.fail('Server didn\'t give us a celebrity.'));
            }

            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        if(books.numFound === 0 || books.docs.length === 0) {
            return message.reply(this.Embed.fail('No books found on OpenLibrary!'));
        }

        const book = books.docs.shift();

        const embed = this.Embed.success(`
        *${book.title}* by ${book.author_name.join(' and ')}
        Published in ${book.first_publish_year}
        ISBN: \`\`${book.isbn.shift()}\`\`

        [Download (PDF)](https://archive.org/download/${book.ia[0]}/${book.ia[0]}.pdf)
        [OpenLibrary](https://openlibrary.org${book.key}/)
        ${book.id_amazon?.[0] ? `[Amazon](https://www.amazon.com/dp/${book.id_amazon[0]}/)` : ''}
        ${book.id_goodreads?.[0] ? `[GoodReads](https://www.goodreads.com/book/show/${book.id_goodreads[0]})` : ''}
        ${book.id_google?.[0] ? `[Google Books](https://books.google.com/books?id=${book.id_google[0]})` : ''}
        
        **[Donate to the Internet Archive](https://archive.org/donate/?platform=ol)**
        `);
        embed.description = embed.description.replace(/^(\s*\r?\n){2,}/gm, '\n');

        return message.reply(embed);
    }
}
