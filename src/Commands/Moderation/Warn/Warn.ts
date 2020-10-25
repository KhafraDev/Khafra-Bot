import { Command } from '../../../Structures/Command.js';
import { Message, SnowflakeUtil } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';
import { FindAndModifyWriteOpResultObject } from 'mongodb';
import { Warnings } from '../../../lib/types/Collections.js';

const epoch = new Date('January 1, 2015 GMT-0');
const zeroBinary = ''.padEnd(64, '0');

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
        const id = message.mentions.members.size > 0
            ? message.mentions.members.first().id
            : args[0]

        if(args.length !== 0) {
            const snowflake = SnowflakeUtil.deconstruct(id);
            if( 
                snowflake.date.getTime() === epoch.getTime()
                || snowflake.binary === zeroBinary
                || snowflake.timestamp > Date.now()
                || snowflake.timestamp === epoch.getTime() // just in case
            ) {
                return message.channel.send(this.Embed.generic('Invalid member ID!'));
            }
        } else if(!isValidNumber(+args[1])) {
            return message.channel.send(this.Embed.generic('Invalid **number** of points!'));
        }

        let member;
        try {
            if(message.mentions.members.size > 0) {
                member = message.mentions.members.first();
            } else if(args.length === 0) {
                member = message.member;
            } else {
                member = await message.guild.members.fetch(id);
            }
        } catch {
            return message.channel.send(this.Embed.generic('Invalid user ID!'));
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
        const total = (warns.value?.users[member.id].reduce((p, c) => p + c.points, 0) ?? 0); //+ Number(args[1]);
        const limit = warns.value?.limit ?? 20;
        const shouldKick = Number(args[1]) + (total % 20) >= limit;

        if(shouldKick) {
            try {
                await member.kick(`Khafra-Bot exceeded ${limit} warning points!`);
            } catch {
                return message.channel.send(this.Embed.fail(`
                An error occurred trying to kick ${member}.
                `));
            }

            return message.channel.send(this.Embed.fail(`
            Kicked ${member} from the server for reaching the max number of warnings (${total + Number(args[1])}/${limit})!
            `));
        } else {
            return message.channel.send(this.Embed.success(`
            ${member} has been given ${args[1]} warning points.

            They now have ${(total + Number(args[1])) % 20}/${limit} warning points before they will be automatically kicked.
            `));
        }
    }
}