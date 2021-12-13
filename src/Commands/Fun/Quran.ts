import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { parseQuran } from '../../lib/Packages/Quran/Quran.js';
import { once } from '../../lib/Utility/Memoize.js';
import { rand } from '../../lib/Utility/Constants/OneLiners.js';
import { inlineCode } from '@khaf/builders';

const Titles = new Map<string, string>();
const Verses = new Map<string, { book: string, verse: string, content: string}>();
const Max = new Map<number, number>();
const mw = once(parseQuran);

export class kCommand extends Command {
    constructor() {
        super(
            [
                'The Quran.'
            ],
			{
                name: 'quran',
                folder: 'Fun',
                args: [0, 1]
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        if (Titles.size === 0) {
            const max: Record<number, number[]> = {};
            const { titles, verses } = await mw();

            for (const title of titles)
                Titles.set(title.chapter, title.title);

            for (const verse of verses) {
                Verses.set(`${verse.book}-${verse.verse}`, verse);
                const [b, v] = [Number(verse.book), Number(verse.verse)];

                (max[b] ??= []).push(v);
            }

            for (const k in max) {
                const m = Math.max(...max[k]);
                Max.set(Number(k), m);
            }
        }

        if (args.length === 0) {
            const chapter = `${await rand(1, 114 + 1)}`; // [1, 114]
            const verse = `${await rand(1, Max.get(Number(chapter))! + 1)}`;

            const excerpt = Verses.get(`${chapter.padStart(3, '0')}-${verse.padStart(3, '0')}`)!;
            const title = Titles.get(chapter)!;

            return this.Embed.ok(`
            ${chapter}:${verse} - ${inlineCode(excerpt.content)}
            `).setTitle(title);
        }

        if (!/\d{1,3}:\d{1,3}/.test(args[0]))
            return this.Embed.generic(this);

        const { b = '', v = '' } = /(?<b>\d{1,3}):(?<v>\d{1,3})/.exec(args[0])?.groups ?? {};
        if (!Verses.has(`${b.padStart(3, '0')}-${v.padStart(3, '0')}`))
            return this.Embed.error(`Verse not found.`);

        const excerpt = Verses.get(`${b.padStart(3, '0')}-${v.padStart(3, '0')}`)!;
        const title = Titles.get(`${Number(excerpt.book)}`)!;

        return this.Embed.ok(`
        ${b}:${v} ${inlineCode(excerpt.content)}
        `).setTitle(title);
    }
}