import { Command } from "../../Structures/Command";
import { Message, GuildMember } from "discord.js";
import Embed from "../../Structures/Embed";
import { Mongo } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            'taggive',
            [
                'Tags: give a tag to another user.',
                'hello @Khafra#0001',
                'hello 541430134230482967'
            ],
            [ /* No extra perms needed */ ],
            15,
            [ 'tagsgive' ]
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 2) {
            return message.channel.send(Embed.missing_args(2, this.name, this.help.slice(1)));
        }

        let member: GuildMember;
        try {
            member = message.mentions.members.first() ?? await message.guild.members.fetch(args[1]); // name [user id]
        } catch {
            return message.channel.send(Embed.fail('A user must be mentioned or an ID must be provided after the tag\'s name!'));
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
                    [`tags.${args[0].toLowerCase()}.owner`]: member.id
                }
            }
        );

        if(value.result.n === 1) {
            return message.channel.send(Embed.success(`Tag was given to ${member}!`));
        } else {
            return message.channel.send(Embed.fail('No tag was edited. Are you sure you own it?'));
        }
    }
}