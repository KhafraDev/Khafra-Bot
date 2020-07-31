import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { Mongo } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            'tagedit',
            [
                'Tags: edit a tag you own.',
                'hello Goodbye!'
            ],
            [ /* No extra perms needed */ ],
            15,
            [ 'tagsedit' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 2) {
            return message.channel.send(Embed.missing_args(2, this.name, this.help.slice(1)));
        }

        const client = await Mongo.connect();
        const collection = client.db('khafrabot').collection('tags');

        const value = await collection.updateOne(
            { 
                $and: [
                    { id: message.guild.id, }, 
                    { [`tags.${args[0].toLowerCase()}.owner`]: message.author.id }
                ]
            },
            { 
                $set: {
                    [`tags.${args[0].toLowerCase()}.value`]: args.slice(1).join(' ')
                }
            }
        );

        if(value.result.n === 1) {
            return message.channel.send(Embed.success('Tag was updated!'));
        } else {
            return message.channel.send(Embed.fail('No tag was edited. Are you sure you own it?'));
        }
    }
}