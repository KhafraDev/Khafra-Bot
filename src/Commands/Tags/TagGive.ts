import { Command } from "../../Structures/Command";
import { Message, GuildMember } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: give a tag to another user.',
                'hello @Khafra#0001',
                'hello 541430134230482967'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'tagsgive',
                folder: 'Tags',
                args: [2, 2],
                aliases: [ 'taggive' ], 
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 2) {
            return message.channel.send(Embed.missing_args.call(this, 2));
        }

        let member: GuildMember;
        try {
            member = message.mentions.members.first() ?? await message.guild.members.fetch(args[1]);
        } catch {
            return message.channel.send(Embed.fail('A user must be mentioned or an ID must be provided after the tag\'s name!'));
        }

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
                    owner: member.id
                },
                $push: {
                    history: {
                        old: message.author.id,
                        new: member.id,
                        now: Date.now()
                    }
                }
            }
        );

        if(u.modifiedCount === 0) {
            return message.channel.send(Embed.fail(`
            Tag hasn't changed ownership. This can happen if you don't own the tag or if the tag is from another guild.
            `));
        }

        return message.channel.send(Embed.success(`Gave the tag to ${member}!`));
    }
}