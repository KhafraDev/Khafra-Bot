import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo.js";

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: create a tag.',
                'hello Hello, everyone!'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'tagscreate',
                folder: 'Tags',
                args: [2],
                aliases: [ 'tagcreate' ],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const q = await collection.findOneAndUpdate(
            {
                id: message.guild.id,
                name: args[0]
            },
            {
                $setOnInsert: {
                    id: message.guild.id,
                    name: args[0],
                    owner: message.author.id,
                    content: args.slice(1).join(' '),
                    created: Date.now()
                }
            },
            { upsert: true, returnOriginal: true }
        );

        if(!q || q.ok === 0 || q.value || q.lastErrorObject?.updatedExisting) {
            return message.reply(this.Embed.fail(`
            Tag couldn't be created because ${q.lastErrorObject?.updatedExisting ? 'it already exists' : 'an unknown error occurred'}.
            `));
        }

        return message.reply(this.Embed.success('Added tag!'));
    }
}