import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";

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
        if(args.length < 2) {
            return message.channel.send(Embed.missing_args.call(this, 2));
        }

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
            return message.channel.send(Embed.fail(`
            Tag couldn't be created because ${q.lastErrorObject?.updatedExisting ? 'it already exists' : 'an unknown error occurred'}.
            `));
        }

        return message.channel.send(Embed.success('Added tag!'));
    }
}