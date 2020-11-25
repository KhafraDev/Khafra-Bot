import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";

import { pool } from "../../Structures/Database/Mongo.js";

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: edit a tag you own.',
                'hello Goodbye!'
            ],
			{
                name: 'tagsedit',
                folder: 'Tags',
                args: [2],
                aliases: [ 'tagedit' ],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const u = await collection.updateOne(
            { 
                id: message.guild.id,
                name: args[0],
                owner: message.author.id
            },
            { 
                $set: {
                    content: args.slice(1).join(' ')
                }
            }
        );

        if(u.modifiedCount === 0) {
            return message.reply(this.Embed.fail(`
            Tag wasn't edited. This can happen if you don't own the tag or if the tag is from another guild.
            `));
        }

        return message.reply(this.Embed.success('Edited the tag!'));
    }
}