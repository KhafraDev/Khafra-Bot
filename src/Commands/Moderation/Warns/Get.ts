import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { formatDate } from '../../../lib/Utility/Date.js';
import { plural } from '../../../lib/Utility/String.js';
import { Warning } from '../../../lib/types/KhafraBot.js';
import { inlineCode } from '@discordjs/builders';

interface Total {
    total_points: string
    dates: Warning['k_ts'][]
    ids: Warning['id'][]
    points: Warning['k_points'][]
}

type FromArray<T extends unknown[]> = T extends (infer U)[]
    ? U
    : never;

type MappedWarning = [FromArray<Total['ids']>, FromArray<Total['dates']>, FromArray<Total['points']>];

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
                name: 'warnings',
                folder: 'Moderation',
                aliases: ['warns'],
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const user = hasPerms(message.channel, message.member, Permissions.FLAGS.KICK_MEMBERS) && args.length === 1
            ? (await getMentions(message, 'users') ?? message.author)
            : message.author;
        
        const { rows } = await pool.query<Total>(`
            SELECT 
                SUM(k_points) AS total_points,
                ARRAY_AGG(k_ts) dates,
                ARRAY_AGG(id) ids,
                ARRAY_AGG(k_points) points
            FROM kbWarns
            WHERE kbWarns.k_guild_id = $1::text AND kbWarns.k_user_id = $2::text
            LIMIT 1;
        `, [message.guild.id, user.id]);

        if (rows.length === 0 || rows[0].dates.length === 0 || rows[0].ids.length === 0)
            return this.Embed.success(`${user} has no warning points! 👍`);

        const { dates, ids, points, total_points } = rows.shift()!;
        const mapped = ids.map<MappedWarning>((id, idx) => [id, dates[idx], points[idx]]);
        const embed = this.Embed.success(
            `${user} has ${ids.length.toLocaleString()} warnings ` +
            `with ${Number(total_points).toLocaleString()} warning points total.`
        );

        // embeds can have a maximum of 25 fields
        for (const [id, date, p] of mapped.slice(0, 25)) {
            const points = p.toLocaleString(message.guild.preferredLocale);
            embed.addField(`**${formatDate('MMMM Do, YYYY', date)}:**`, `${inlineCode(id)}: ${points} point${plural(p)}.`, true);
        }

        return embed;
    }
}