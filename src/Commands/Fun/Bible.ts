import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo";
import { titleRegex, titles, parseBible } from "../../lib/Backend/Bible/Bible";
import Embed from "../../Structures/Embed";
import { BibleExcerpt } from "../../lib/types/Collections";

let updated = false;

const toUpperCase = (s: string) => {
    return s.split(/\s+/).map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase()).join(' ');
};

export default class extends Command {
    constructor() {
        super(
            [
                'Get a King James Bible verse.',
                'Nahum 3:7', 'Proverbs 25:19'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'bible',
                folder: 'Fun',
                args: [0, 2]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!updated) {
            const client = await pool.commands.connect();
            const collection = client.db('khafrabot').collection('bible');
            const exists = await collection.findOne({}) as BibleExcerpt;
            if(!exists) {
                const parsed = parseBible();
                await collection.insertMany(parsed);
                updated = true;
            }
        }

        // list all books available to the bot
        if(args[0]?.toLowerCase() === 'list') {
            return message.channel.send(Embed.success(Object.keys(titles).map(t => `\`\`${t}\`\``).join(', ')));
        }

        const book = args.join(' ').match(titleRegex);
        // no chapters found and there are arguments
        // representing misuse of the command
        if((!book || book.length === 0) && args.length !== 0) { 
            return message.channel.send(Embed.missing_args.call(this, 3, 'No chapters found!'));
        }

        // last valid argument
        const last = args.length === 0 ? null : args.slice(book[0].split(' ').length).shift();
        if(last && !/\d+:\d+/.test(last)) { // last exists and follows format `number(s):number(s)`
            return message.channel.send(Embed.missing_args.call(this, 3, 'Invalid format!'));
        }

        const [chapter, verse] = last ? last.split(':') : [null, null];
        // if there's no chapter or verse and there are arguments
        // !NaN === true; +null === NaN; +'string' === NaN
        if((!+chapter || !+verse) && args.length !== 0) {
            return message.channel.send(Embed.missing_args.call(this, 3, 'Missing chapter or verse!'));
        }

        const client = await pool.commands.connect();
        const collection = client.db('khafrabot').collection('bible');

        if(args.length !== 0) {
            const short = Object.entries(titles).filter(([k]) => k === toUpperCase(book[0]));
            const item = await collection.findOne({
                book: toUpperCase(short[0][1]),
                chapter: +chapter,
                verse: +verse
            }) as BibleExcerpt;

            if(!item) {
                return message.channel.send(Embed.missing_args.call(this, 3, 'No verse found!'));
            }

            const embed = Embed.success(item.content)
                .setTitle(`${toUpperCase(book[0])} ${item.chapter}:${item.verse}`);

            return message.channel.send(embed);
        } else {
            const random = await collection.aggregate([ { $sample: { size: 1 } } ]).toArray() as BibleExcerpt[];
            const long = Object.entries(titles).filter(([, v]) => v.toLowerCase() === random[0].book.toLowerCase());
            const embed = Embed.success(random[0].content)
                .setTitle(`${long[0][0]} ${random[0].chapter}:${random[0].verse}`);

            return message.channel.send(embed);
        }
    }
}