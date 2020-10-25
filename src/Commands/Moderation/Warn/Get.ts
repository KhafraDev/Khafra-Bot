import { Command } from '../../../Structures/Command.js';
import { Message, SnowflakeUtil } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { Warnings } from '../../../lib/types/Collections.js';

const epoch = new Date('January 1, 2015 GMT-0');
const zeroBinary = ''.padEnd(64, '0');

export default class extends Command {
    constructor() {
        super(
            [
                'Get the amount of warning points a user has.',
                '267774648622645249',
                '@Khafra#0001'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'getwarn',
                aliases: [ 'getwarns', 'warnings', 'warning', 'warns' ],
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        let member;
        if(!super.userHasPerms(message, [ 'KICK_MEMBERS' ])) {
            member = message.member;
        } else {
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
            }

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
        }

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');
        const warns = await collection.findOne<Warnings>({ id: message.guild.id });
        if(!warns?.users || !(member.id in warns.users) || !Array.isArray(warns.users[member.id])) {
            return message.channel.send(this.Embed.success(`
            ${member} has 0 warnings!
            `));
        } else {
            const warnings = warns.users[member.id]
                .reverse()
                .slice(0, 10)
                .map(w => `${w.points} points: \`\`${w.reason.slice(0, 100)}\`\``)
                .join('\n');

            return message.channel.send(this.Embed.success(`
            ${member}'s last ${warns.users[member.id].slice(0, 10).length} warnings!
            ${warnings}
            `));
        }
    }
}