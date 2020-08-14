import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            { name: 'tagscreate', folder: 'Tags' },
            [
                'Tags: create a tag.',
                'hello Hello, everyone!'
            ],
            [ /* No extra perms needed */ ],
            15,
            [ 'tagcreate' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 2) {
            return message.channel.send(Embed.missing_args.call(this, 2));
        }

        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const value = await collection.updateOne(
            { 
                $and: [
                    { id: message.guild.id },
                    { [`tags.${args[0].toLowerCase()}`]: { $exists: false } }
                ],
            },
            {
                $set: {
                    [`tags.${args[0].toLowerCase()}`]: {
                        name: args[0].toLowerCase(),
                        owner: message.author.id,
                        value: args.slice(1).join(' '),
                        created: new Date()
                    }
                }
            },
            { upsert: false }
        )

        if(value.result.n === 0) {
            return message.channel.send(Embed.fail(`
            Tag already exists, or has yet to be implemented by an administrator!
            `));
        } else {
            return message.channel.send(Embed.success(`
            Tag has been added!
            `));
        }
    }
}