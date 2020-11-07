import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { FindAndModifyWriteOpResultObject } from 'mongodb';
import { Warnings } from '../../../lib/types/Collections.js';
import { getMentions, validSnowflake } from '../../../lib/Utility/Mentions.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Warn someone for breaking a rule.',
                '@user 5 for trolling',
                '1234567891234567 5'
            ],
            [ 'KICK_MEMBERS' ],
            {
                name: 'warn',
                folder: 'Moderation',
                args: [2],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        const idOrUser = getMentions(message, args);
        if(!isValidNumber(+args[1], { allowNegative: true })) {
            return message.channel.send(this.Embed.generic('Invalid **number** of points!'));
        } else if(!idOrUser || (typeof idOrUser === 'string' && !validSnowflake(idOrUser))) {
            return message.channel.send(this.Embed.generic('Invalid user ID!'));
        }

        let member = message.guild.member(idOrUser) ?? message.guild.members.fetch(idOrUser);
        if(member instanceof Promise) {
            try {
                member = await member;
            } catch {
                return message.channel.send(this.Embed.fail(`
                ${member} couldn't be fetched!
                `));
            }
        }

        if(!member.kickable) {
            return message.channel.send(this.Embed.fail(`I can't warn someone I don't have permission to kick!`));
        }

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');
        const warns = await collection.findOneAndUpdate(
            { id: message.guild.id },
            {
                $push: {
                    [`users.${member.id}`]: {
                        points: Number(args[1]),
                        reason: args.slice(2).join(' '),
                        timestamp: Date.now()
                    }
                },
                $setOnInsert: {
                    limit: 20
                }
            },
            { returnOriginal: true, upsert: true }
        ) as FindAndModifyWriteOpResultObject<Warnings>;

        // value is null when the doc is inserted for the first time
        const total = (warns.value?.users?.[member.id]?.reduce((p, c) => p + c.points, 0) ?? 0) + Number(args[1]);
        const limit = warns.value?.limit ?? 20;
        const shouldKick = total >= limit;

        if(shouldKick) {
            try {
                await member.kick(`Khafra-Bot exceeded ${limit} warning points!`);
            } catch {
                return message.channel.send(this.Embed.fail(`
                An error occurred trying to kick ${member}.
                `));
            }

            await collection.findOneAndUpdate(
                { id: message.guild.id },
                {
                    $unset: {
                        [`users.${member.id}`]: ''
                    }
                },
                { returnOriginal: true, upsert: true }
            );

            return message.channel.send(this.Embed.fail(`
            Kicked ${member} from the server for reaching the max number of warnings (${total}/${limit})!
            `));
        } else {
            return message.channel.send(this.Embed.success(`
            ${member} has been given ${args[1]} warning points.

            They now have ${total}/${limit} warning points before they will be automatically kicked.
            `));
        }
    }
}