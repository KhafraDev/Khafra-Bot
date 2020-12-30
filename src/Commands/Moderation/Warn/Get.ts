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
        let member, memberStr;
        if(!super.userHasPerms(message, [ 'KICK_MEMBERS' ])) {
            member = message.member.id;
            memberStr = member;
        } else {
            const idOrUser = getMentions(message, args, { type: 'members' });
            if(!idOrUser || (typeof idOrUser === 'string' && !validSnowflake(idOrUser))) {
                return message.reply(this.Embed.generic('Invalid user ID!'));
            } else if(idOrUser instanceof GuildMember) {
                member = idOrUser.id;
                memberStr = idOrUser;
            } else {
                member = memberStr = idOrUser;
            }
        }

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');
        const warns = await collection.findOne<Warnings>({ id: message.guild.id });

        if(
            !warns?.users || 
            !(member in warns.users) || 
            !Array.isArray(warns.users[member].warns) ||
            warns.users[member].warns.length === 0
        ) {
            return message.reply(this.Embed.success(`${memberStr} has no warnings!`));
        } 

        const user = warns.users[member];
        const total = user.active + user.inactive;

        return message.reply(this.Embed.success(`
        ${memberStr} has ${total} warning points (${user.active} active, ${user.inactive} inactive).
        ${user.warns
            .slice(-5)
            .reverse()
            .map(w => `${w.points} for ${w.reason.length ? `\`\`${w      .reason}\`\`` : 'N/A'}`)
            .join('\n')
        }
        `).setFooter(`👟 AutoKick: ${warns.limit} points.`));
    }
}