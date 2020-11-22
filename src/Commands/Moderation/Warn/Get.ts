import { Command } from '../../../Structures/Command.js';
import { Message, GuildMember } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { Warnings } from '../../../lib/types/Collections.js';
import { getMentions, validSnowflake } from '../../../lib/Utility/Mentions.js';

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
            member = message.member.id;
        } else {
            const idOrUser = getMentions(message, args, { type: 'members' });
            if(!idOrUser || (typeof idOrUser === 'string' && !validSnowflake(idOrUser))) {
                return message.reply(this.Embed.generic('Invalid user ID!'));
            } else if(idOrUser instanceof GuildMember) {
                member = idOrUser.id;
            } else {
                member = idOrUser;
            }
        }

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');
        const warns = await collection.findOne<Warnings>({ id: message.guild.id });
        const memberStr = message.guild.member(member) ?? member ?? args[0];

        if(!warns?.users || !(member in warns.users) || !Array.isArray(warns.users[member])) {
            return message.reply(this.Embed.success(`
            ${memberStr} has 0 warnings!
            `));
        } 

        const warnings = warns.users[member]
            .reverse()
            .slice(0, 10)
            .map(w => `${w.points} points: \`\`${w.reason.slice(0, 100) || 'N/A'}\`\``)
            .join('\n');

        return message.reply(this.Embed.success(`
        ${memberStr}'s last ${warns.users[member].reverse().slice(0, 10).length} warnings!
        Total points: \`\`${warns.users[member].reduce((p, c) => p + c.points, 0)}\`\`
        ${warnings}
        `));
    }
}