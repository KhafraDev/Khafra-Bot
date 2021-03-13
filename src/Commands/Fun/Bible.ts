import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { pool } from '../../Structures/Database/Mongo.js';
import { titleRegex, titles, parseBible } from '../../lib/Backend/Bible/Bible.js';
import { BibleExcerpt } from '../../lib/types/Collections';
import { upperCase } from '../../lib/Utility/String.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

let updated = false;

const toUpperCase = (s: string) => 
    s.split(/\s+/)
        .map(n => upperCase(n))
        .join(' ');

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a King James Bible verse.',
                'Nahum 3:7', 'Proverbs 25:19'
            ],
			{
                name: 'bible',
                folder: 'Fun',
                args: [0, 2]
            }
        );
    }

    async init(_message: Message, args: string[]) {
        if (!updated) {
            const client = await pool.commands.connect();
            const collection = client.db('khafrabot').collection('bible');
            const exists = await collection.findOne<BibleExcerpt>({});
            if (!exists) {
                const parsed = await parseBible();
                await collection.insertMany(parsed);
                updated = true;
            }
        }

        // list all books available to the bot
        if (args[0]?.toLowerCase() === 'list') {
            return this.Embed.success(Object.keys(titles).map(t => `\`\`${t}\`\``).join(', '));
        }

        const book = args.join(' ').match(titleRegex);
        // no chapters found and there are arguments
        // representing misuse of the command
        if ((!book || book.length === 0) && args.length !== 0) { 
            return this.Embed.fail('No chapters found!');
        }

        // last valid argument
        const last = args.length === 0 ? null : args.slice(book[0].split(' ').length).shift();
        if (last && !/\d+:\d+/.test(last)) { // last exists and follows format `number(s):number(s)`
            return this.Embed.fail('Invalid format!');
        }

        const [chapter, verse] = last ? last.split(':') : [null, null];
        // if there's no chapter or verse and there are arguments
        // !NaN === true; +null === NaN; +'string' === NaN
        if ((!+chapter || !+verse) && args.length !== 0) {
            return this.Embed.fail('Missing chapter or verse!');
        }

        const client = await pool.commands.connect();
        const collection = client.db('khafrabot').collection('bible');

        if (args.length !== 0) {
            const short = Object.entries(titles).filter(([k]) => k === toUpperCase(book[0]));
            const item = await collection.findOne<BibleExcerpt>({
                book: toUpperCase(short[0][1]),
                chapter: +chapter,
                verse: +verse
            });

            if (!item) {
                return this.Embed.fail('No verse found!');
            }

            return this.Embed.success(item.content)
                .setTitle(`${toUpperCase(book[0])} ${item.chapter}:${item.verse}`);
        } else {
            const random = await collection.aggregate<BibleExcerpt>([ { $sample: { size: 1 } } ]).next();
            const long = Object.entries(titles).filter(([, v]) => v.toLowerCase() === random.book.toLowerCase());
            
            return this.Embed.success(random.content)
                .setTitle(`${long[0][0]} ${random.chapter}:${random.verse}`);
        }
    }
}