import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { plural } from '../../../lib/Utility/String.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { formatDate } from '../../../lib/Utility/Date.js';
import { WarningJoined } from '../../../lib/types/Warnings.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a member\'s warnings.',
                '',
                '@Khafra',
                '267774648622645249'
            ],
			{
                name: 'warnings:next',
                folder: 'Moderation',
                aliases: ['warns:next'],
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const user = hasPerms(message.channel, message.member, Permissions.FLAGS.KICK_MEMBERS) && args.length === 1
            ? (await getMentions(message, 'users') ?? message.author)
            : message.author;
        
        const { rows } = await pool.query<WarningJoined>(`
            SELECT * FROM kbWarns
            WHERE kbWarns.k_guild_id = $1::text AND kbWarns.k_user_id = $2::text
            LIMIT 25; 
        `, [message.guild.id, user.id]);

        // total warning points the person has
        const totalMemberPoints = rows.reduce((a, b) => a + b.k_points, 0);

        const embed = this.Embed.success(
            `${user} - ${totalMemberPoints.toLocaleString(message.guild.preferredLocale)} point${plural(totalMemberPoints)}` + 
            ` and ${rows.length.toLocaleString(message.guild.preferredLocale)} warning${plural(rows.length)}.`
        );

        // embeds can have a maximum of 25 fields
        for (const row of rows.slice(0, 25)) {
            const points = row.k_points.toLocaleString(message.guild.preferredLocale);
            embed.addField(`**${formatDate('MMMM Do, YYYY', row.k_ts)}:**`, `#${row.id}: ${points} point${plural(row.k_points)}.`, true);
        }

        return embed;
    }
}