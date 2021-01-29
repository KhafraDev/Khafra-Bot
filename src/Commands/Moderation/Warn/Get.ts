import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { Warnings } from '../../../lib/types/Collections.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';

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

    async init(message: Message) {
        const member = super.userHasPerms(message, [ 'KICK_MEMBERS' ])
            ? await getMentions(message, 'members')
            : message.member

        const client = await pool.moderation.connect();
        const collection = client.db('khafrabot').collection('moderation');
        const warns = await collection.findOne<Warnings>({ id: message.guild.id });

        if(
            !warns?.users || 
            !(member.id in warns.users) || 
            !Array.isArray(warns.users[member.id].warns) ||
            warns.users[member.id].warns.length === 0
        ) {
            return message.reply(this.Embed.success(`${member} has no warnings!`));
        } 

        const user = warns.users[member.id];
        const total = user.active + user.inactive;

        return message.reply(this.Embed.success(`
        ${member} has ${total} warning points (${user.active} active, ${user.inactive} inactive).
        ${user.warns
            .slice(-5)
            .reverse()
            .map(w => `${w.points} for ${w.reason.length ? `\`\`${w      .reason}\`\`` : 'N/A'}`)
            .join('\n')
        }
        `).setFooter(`👟 AutoKick: ${warns.limit} points.`));
    }
}