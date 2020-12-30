import { Command } from '../../Structures/Command.js';
import { Message, GuildMember } from 'discord.js';

import { pool } from '../../Structures/Database/Mongo.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Tags: give a tag to another user.',
                'hello @Khafra#0001',
                'hello 541430134230482967'
            ],
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
        if(message.mentions.members.size === 0) {
            return message.reply(this.Embed.fail('A guild member must be mentioned!'));
        } else if(message.mentions.members.size > 2) {
            return message.reply(this.Embed.fail('Too many people mentioned!'));
        }

        if(!/(<@!)?\d{17,19}>?/.test(args[0])) {
            return message.reply(this.Embed.fail(`
            No guild member mentioned and no user ID provided.
            `));
        }

        let member: GuildMember;
        try {
            member = await message.guild.members.fetch(args[0].replace(/[^\d]/g, ''));
        } catch {
            return message.reply(this.Embed.fail('Invalid ID provided or member mentioned!'));
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
            return message.reply(this.Embed.fail(`
            Tag hasn't changed ownership. This can happen if you don't own the tag or if the tag is from another guild.
            `));
        }

        return message.reply(this.Embed.success(`Gave the tag to ${member}!`));
    }
}