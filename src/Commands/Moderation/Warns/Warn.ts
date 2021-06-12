import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { hasPerms, hierarchy } from '../../../lib/Utility/Permissions.js';
import { Range } from '../../../lib/Utility/Range.js';
import { validateNumber } from '../../../lib/Utility/Valid/Number.js';
import { kGuild } from '../../../lib/types/Warnings.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { plural } from '../../../lib/Utility/String.js';

interface WarningRet {
    total_points: string
    k_id: number
}

const range = Range(0, 32767, true);
const logChannel = Permissions.FLAGS.SEND_MESSAGES | Permissions.FLAGS.EMBED_LINKS;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Warn someone for breaking a rule.',
                '@user 5 for trolling',
                '1234567891234567 5'
            ],
			{
                name: 'warn',
                folder: 'Moderation',
                args: [2],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.KICK_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: kGuild) {
        const points = Number(args[1]);

        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.KICK_MEMBERS))
            return this.Embed.missing_perms(false, Permissions.FLAGS.KICK_MEMBERS);
        else if (!validateNumber(points) || !range.isInRange(points))
            return this.Embed.fail(`An invalid number of points was provided, user wasn't warned!`);
        
        const member = await getMentions(message, 'members');
        if (!member)
            return this.Embed.fail('Failed to fetch the member, sorry. 😕\n Are they in the guild?');
        else if (!hierarchy(message.member, member))
            return this.Embed.fail(`You can't warn ${member}! 🤣`);
        else if (!hierarchy(message.guild.me, member))
            return this.Embed.fail(`I can't warn ${member}! 😦`);

        const { rows } = await pool.query<WarningRet>(`
            WITH warns AS (
                SELECT kbWarns.k_id, k_points 
                FROM kbWarns
                WHERE kbWarns.k_guild_id = $1::text AND kbWarns.k_user_id = $2::text
            ), inserted AS (
                INSERT INTO kbWarns (
                    k_guild_id, 
                    k_user_id, 
                    k_points, 
                    k_id
                ) VALUES (
                    $1::text, 
                    $2::text, 
                    $3::smallint,
                    (SELECT COUNT(kbWarns.id) FROM kbWarns WHERE kbWarns.k_guild_id = $1::text) + 1
                ) RETURNING k_points, k_id
            )

            SELECT 
                SUM(warns.k_points) + inserted.k_points AS total_points, 
                inserted.k_id
            FROM warns, inserted
            GROUP BY inserted.k_points, inserted.k_id;
        `, [message.guild.id, member.id, points]);

        if (rows.length === 0)
            return this.Embed.fail(`Yeah, I'm not really sure what happened. 🤯`);
     
        const { total_points, k_id } = rows.shift()!;
        // parsing error/not parsed by pg correctly
        const total = Number(total_points);

        // old warnings should not be nullified, subsequent warnings will each result in a kick.
        if (settings.max_warning_points <= total) {
            try {
                await member.kick();
            } catch {
                return this.Embed.fail(`Member was warned (#${k_id}) but an error prevented me from kicking them.`);
            }

            await message.reply({ embeds: [this.Embed.success(
                `${member} was automatically kicked from the server for having ` + 
                `${total.toLocaleString()} warning point${plural(total)} (#${k_id}).`
            )] });
        } else {
            await message.reply({ embeds: [this.Embed.success(`
            Gave ${member} ${points.toLocaleString()} warning point${plural(points)} (#${k_id}).
            Member has ${total.toLocaleString()} points total.
            `)] });
        }

        if (settings.mod_log_channel !== null) {
            const channel = message.guild.channels.cache.get(settings.mod_log_channel);
            if (!isText(channel) || !hasPerms(channel, message.guild.me, logChannel))
                return;

            const reason = args.slice(2).join(' ');
            return channel.send({ embeds: [this.Embed.success(`
            **Offender:** ${member}
            **Reason:** ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            **Staff:** ${message.member}
            **Points:** ${points} warning point${plural(points)} given.
            **Kicked:** ${settings.max_warning_points <= total ? 'Yes' : 'No'} (${total.toLocaleString()} total point${plural(total)}).
            **ID:** #${k_id}
            `).setTitle('Member Warned')] });
        }
    }
}