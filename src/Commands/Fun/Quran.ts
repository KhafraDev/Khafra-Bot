import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo.js";
import { parseQuran } from "../../lib/Backend/Quran/Quran.js";
import { QuranExcerpt } from "../../lib/types/Collections";
import { promisify } from "util";
import { randomInt } from "crypto";

const randInt: (max: number) => Promise<number> = promisify(randomInt);
let updated = false;

export default class extends Command {
    constructor() {
        super(
            [
                'The Quran.',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'quran',
                folder: 'Fun',
                args: [0]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!updated) {
            const client = await pool.commands.connect();
            const collection = client.db('khafrabot').collection('quran');
            const exists = await collection.findOne<QuranExcerpt>({});
            if(!exists) {
                const parsed = await parseQuran();
                await collection.insertMany(parsed);
                updated = true;
            }
        }

        const last = args.pop();
        if(!/\d+:\d+/.test(last) && args.length !== 0) {
            return message.reply(this.Embed.generic());
        }

        const [, b, v] = last?.match(/(\d+):(\d+)/) ?? [];

        const client = await pool.commands.connect();
        const collection = client.db('khafrabot').collection('quran');

        if(args.length === 0) {
            const random = await collection.aggregate<QuranExcerpt>([ { $sample: { size: 1 } } ]).next();
            const randVerse = random.verses[await randInt(random.verses.length)]; // [min=0, max)

            return message.reply(this.Embed.success(`
            **${random.title}** ${randVerse.book}:${randVerse.verse}
            ${randVerse.content}
            `));
        }

        const verse = await collection.findOne<QuranExcerpt>({
            title: new RegExp(args.join(' '), 'i'),
            'verses.book': +b,
            'verses.verse': +v
        });

        if(!verse) {
            return message.reply(this.Embed.fail(`
            No verses found!
            
            A list can be found [here](https://sacred-texts.com/isl/pick/)!
            `));
        }

        const f = verse.verses.filter(i => i.book === +b && i.verse === +v).shift();
        return message.reply(this.Embed.success(`
        **${verse.title}** ${b}:${v}
        ${f.content}
        `));
    }
}