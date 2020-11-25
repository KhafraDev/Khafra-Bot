import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { pool } from "../../Structures/Database/Mongo.js";

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: delete a tag you own.',
                'hello', 'mytag'
            ],
			{
                name: 'tagsdelete',
                folder: 'Tags',
                args: [1, 1],
                aliases: [ 'tagdelete' ],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const d = await collection.findOneAndDelete({
            id: message.guild.id,
            name: args[0],
            owner: message.author.id
        });

        if(!d || d.lastErrorObject?.n === 0 || !d.value) {
            return message.reply(this.Embed.fail(`
            Tag wasn't deleted. This can happen if you don't own the tag or if the tag is from another guild.
            `));
        }

        return message.reply(this.Embed.success('Deleted the tag! Re-create it with ``tags create``!'));
    }
}