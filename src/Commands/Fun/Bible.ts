import { Arguments, Command } from '#khaf/Command';
import { sql } from '#khaf/database/Postgres.js';
import { bibleInsertDB, titleRegex, titles } from '#khaf/migration/Bible.js';
import { upperCase } from '#khaf/utility/String.js';
import { inlineCode, type UnsafeEmbed } from '@discordjs/builders';
import { Message } from 'discord.js';

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

export class kCommand extends Command {
    constructor () {
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

    async init (_message: Message, { args, content }: Arguments): Promise<UnsafeEmbed | undefined> {
        const inserted = await bibleInsertDB();

        if (inserted !== true) {
            return this.Embed.error('Try again in a minute!');
        }

        // no arguments provided, get a random entry
        if (args.length === 0) {
            const rows = await sql<IBibleVerse[]>`
                SELECT * FROM kbBible TABLESAMPLE BERNOULLI(.1) ORDER BY random() LIMIT 1;
            `;

            // basically the same as bookAcronym down below
            const book = Object
                .entries(titles)
                .find(([, c]) => c.toLowerCase() === rows[0].book.toLowerCase())!
                .shift()!;

            return this.Embed.ok()
                .setTitle(`${book} ${rows[0].chapter}:${rows[0].verse}`)
                .setDescription(rows[0].content);
        }

        // list all books available to the bot
        if (args[0].toLowerCase() === 'list') {
            return this.Embed.ok(Object.keys(titles).map(t => inlineCode(t)).join(', '));
        } else if (!titleRegex.test(content)) {
            return this.Embed.error(`
            No book with that name was found!

            Use ${inlineCode(`${this.settings.name} list`)} to list all of the supported book names!
            `);
        }

        const book = titleRegex.exec(content)![0].toLowerCase().trim();
        // get the acronym of the book, for example "Prayer of Azariah" -> "aza"
        const bookAcronym = Object
            .entries(titles)
            .find(([n, acr]) => n.toLowerCase() === book || acr === book)!;

        // get the chapter+verse
        const locationUnformatted = content.split(book).at(-1)!.trim();

        if (!R.GENERIC.test(locationUnformatted)) {
            // get verses in chapter
            if (R.CHAPTER.test(locationUnformatted)) {
                const rows = await sql<IBibleVerse[]>`
                    SELECT * FROM kbBible
                    WHERE
                        book = ${upperCase(bookAcronym[1])}::text AND
                        chapter = ${Number(locationUnformatted)}::smallint
                    ORDER BY verse DESC
                    LIMIT 1;
                `;

                return this.Embed.ok(`
                Chapter ${rows[0].chapter} of ${bookAcronym[0]} has ${rows[0].verse} verses.
                `);
            }

            // if not chapter is provided, get the number of chapters in the book
            const rows = await sql<IBibleVerse[]>`
                SELECT * FROM kbBible 
                WHERE book = ${upperCase(bookAcronym[1])}::text
                ORDER BY chapter DESC
                LIMIT 1;
            `;

            const chaper = rows.length === 0 ? 'no' : rows[0].chapter;
            return this.Embed.ok(`${bookAcronym[0]} has ${chaper} chapters.`);
        }

        // Example: 13:1-5
        // Get verses 1 to 5 from Exodus chapter 13
        if (R.BETWEEN.test(locationUnformatted)) {
            const [, chapter, ...verses] = R.BETWEEN
                .exec(locationUnformatted)! // not null since it matches the pattern
                .map(Number); // Not NaN because the regex checks for numbers

            // prevent >10 verses from being sent at a time
            // not only to prevent abuse, but because of the 2048 character limit
            const versesDiff = verses[1] - verses[0] > 10
                ? [verses[0], verses[0] + 9] // sql between is inclusive
                : verses

            const rows = await sql<IBibleVerse[]>`
                SELECT * FROM kbBible
                WHERE
                    book = ${upperCase(bookAcronym.pop()!)}::text AND
                    chapter = ${chapter}::smallint AND
                    verse BETWEEN ${versesDiff[0]}::smallint AND ${versesDiff[1]}::smallint
                LIMIT 10;
            `;

            if (rows.length === 0)
                return this.Embed.error(`
                No verses found in ${bookAcronym.pop()} ${chapter}:${versesDiff[0]}-${versesDiff[1]}! 😕
                `);

            const [first, last] = [rows.at(0)!, rows.at(-1)!];
            return this.Embed.ok()
                .setTitle(`${bookAcronym.pop()} ${chapter}:${first.verse}-${last.verse}`)
                .setDescription(`
                ${rows.map(v => v.content).join('\n')}
                `.slice(0, 2048));
        }

        // only one verse; doesn't fit criteria for other cases
        if (R.GENERIC.test(locationUnformatted)) {
            const [, chapter, verse] = R.GENERIC
                .exec(locationUnformatted)!
                .map(Number);

            const rows = await sql<IBibleVerse[]>`
                SELECT * FROM kbBible
                WHERE
                    book = ${upperCase(bookAcronym[1])}::text AND
                    chapter = ${chapter}::smallint AND
                    verse = ${verse}::smallint
                LIMIT 1;
            `;

            if (rows.length === 0)
                return this.Embed.error(`
                No verses found for ${bookAcronym.pop()} ${chapter}:${verse}! 😕
                `);

            return this.Embed.ok()
                .setTitle(`${bookAcronym.shift()} ${chapter}:${verse}`)
                .setDescription(rows[0].content);
        }
    }
}