import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { bibleInsertDB, titleRegex, titles } from '../../lib/Migration/Bible.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { upperCase } from '../../lib/Utility/String.js';

interface IBibleVerse {
    idx: number
    book: string
    chapter: number
    verse: number
    content: string
}

const R = {
    GENERIC: /(\d{1,2}):(\d{1,2})/,
    BETWEEN: /(\d{1,2}):(\d{1,2})-(\d{1,2})/,
    CHAPTER: /(\d{1,2})/
} as const;

@RegisterCommand
export class kCommand extends Command {
    middleware = [bibleInsertDB];
    constructor() {
        super(
            [
                'Get a King James Bible verse.',
                'Nahum 3:7', 'Proverbs 25:19'
            ],
			{
                name: 'bible',
                folder: 'Fun',
                args: [0]
            }
        );
    }

    async init(_message: Message, args: string[]) {
        // no arguments provided, get a random entry
        if (args.length === 0) {
            const { rows } = await pool.query<IBibleVerse>(`
                SELECT * FROM kbBible TABLESAMPLE BERNOULLI(.1) ORDER BY random() LIMIT 1;
            `);

            // basically the same as bookAcronym down below
            const book = Object 
                .entries(titles)
                .find(([, c]) => c.toLowerCase() === rows[0].book.toLowerCase())
                .shift();

            return this.Embed.success()
                .setTitle(`${book} ${rows[0].chapter}:${rows[0].verse}`)
                .setDescription(rows[0].content);
        }

        // list all books available to the bot
        if (args[0]?.toLowerCase() === 'list') {
            return this.Embed.success(Object.keys(titles).map(t => `\`\`${t}\`\``).join(', '));
        }

        const book = args.join(' ').match(titleRegex)?.[0].toLowerCase();
        // if an invalid book name was used
        if (!book)
            return this.Embed.fail(`
            No book found with that name! Were you using an acronym?
            KhafraBot only supports the full names of the books, which you can view using \`bible list\`!
            `);

        // get the acronym of the book, for example "Prayer of Azariah" -> "aza"
        const bookAcronym = Object
            .entries(titles)
            .find(([n, acr]) => n.toLowerCase() === book || acr === book);

        // get the chapter+verse
        const locationUnformatted = args
            .join(' ')
            .replace(new RegExp(`(.*?)${book}(\\s+)?`, 'gi'), '');

        if (!R.GENERIC.test(locationUnformatted)) {
            // get verses in chapter
            if (R.CHAPTER.test(locationUnformatted)) {
                const { rows } = await pool.query<IBibleVerse>(`
                    SELECT * FROM kbBible
                    WHERE book = $1 AND chapter = $2
                    ORDER BY verse DESC
                    LIMIT 1;
                `, [upperCase(bookAcronym[1]), Number(locationUnformatted)]);
                
                return this.Embed.success(`
                Chapter ${rows[0].chapter} of ${bookAcronym[0]} has ${rows[0].verse} verses.
                `);
            }
            
            // if not chapter is provided, get the number of chapters in the book
            const { rows } = await pool.query<IBibleVerse>(`
                SELECT * FROM kbBible 
                WHERE book = $1
                ORDER BY chapter DESC
                LIMIT 1;
            `, [upperCase(bookAcronym[1])]);

            return this.Embed.success(`
            ${bookAcronym[0]} has ${rows[0]?.chapter ?? 'no'} chapters.
            `);
        }

        // Example: 13:1-5
        // Get verses 1 to 5 from Exodus chapter 13
        if (R.BETWEEN.test(locationUnformatted)) {
            const [, chapter, ...verses] = locationUnformatted
                .match(R.BETWEEN)! // not null since it matches the pattern
                .map(Number); // Not NaN because the regex checks for numbers

            // prevent >10 verses from being sent at a time
            // not only to prevent abuse, but because of the 2048 character limit
            const versesDiff = verses[1] - verses[0] > 10
                ? [verses[0], verses[0] + 9] // sql between is inclusive
                : verses

            const { rows } = await pool.query<IBibleVerse>(`
                SELECT * FROM kbBible
                WHERE
                    book = $1 AND
                    chapter = $2 AND
                    verse BETWEEN $3 AND $4
                ;
            `, [upperCase(bookAcronym.pop()), chapter, ...versesDiff]);

            if (rows.length === 0)
                return this.Embed.fail(`
                No verses found in ${bookAcronym.pop()} ${chapter}:${versesDiff[0]}-${versesDiff[1]}! 😕
                `);

            return this.Embed.success()
                .setTitle(`${bookAcronym.pop()} ${chapter}:${versesDiff[0]}-${versesDiff[1]}`)
                .setDescription(`
                ${rows.map(v => v.content).join('\n')}
                `.slice(0, 2048));
        }

        // only one verse; doesn't fit criteria for other cases
        if (R.GENERIC.test(locationUnformatted)) {
            const [, chapter, verse] = locationUnformatted
                .match(R.GENERIC)
                .map(Number);

            const { rows } = await pool.query<IBibleVerse>(`
                SELECT * FROM kbBible
                WHERE
                    book = $1 AND
                    chapter = $2 AND
                    verse = $3
                LIMIT 1;
            `, [upperCase(bookAcronym[1]), chapter, verse]);

            if (rows.length === 0)
                return this.Embed.fail(`
                No verses found for ${bookAcronym.pop()} ${chapter}:${verse}! 😕
                `);

            return this.Embed.success()
                .setTitle(`${bookAcronym.shift()} ${chapter}:${verse}`)
                .setDescription(rows[0].content);
        }
    }
}