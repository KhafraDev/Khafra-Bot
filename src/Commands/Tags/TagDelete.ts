import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            { name: 'tagsdelete', folder: 'Tags' },
            [
                'Tags: delete a tag you own.',
                'hello', 'mytag'
            ],
            [ /* No extra perms needed */ ],
            15,
            [ 'tagdelete' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name.name, this.help.slice(1)));
        }

        const client = await pool.tags.connect();
        const collection = client.db('khafrabot').collection('tags');

        const value = await collection.deleteOne(
            { 
                $and: [
                    { id: message.guild.id, }, 
                    { [`tags.${args[0].toLowerCase()}.owner`]: message.author.id }
                ]
            }
        );

        if(value.result.n === 1) {
            return message.channel.send(Embed.success('Tag was deleted!'));
        } else {
            return message.channel.send(Embed.fail('No tag was deleted. Are you sure you own it?'));
        }
    }
}