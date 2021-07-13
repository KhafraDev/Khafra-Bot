import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { hasPerms, hierarchy } from '../../../lib/Utility/Permissions.js';
import { Range } from '../../../lib/Utility/Range.js';
import { validateNumber } from '../../../lib/Utility/Valid/Number.js';
import { kGuild, Warning } from '../../../lib/types/KhafraBot.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { plural } from '../../../lib/Utility/String.js';
import { inlineCode } from '@discordjs/builders';

type WarnInsert = {
    insertedid: Warning['id']
    insertedpoints: Warning['k_points']
    k_ts: Warning['k_ts']
}

const range = Range(0, 32767, true);
const perms = new Permissions([
    Permissions.FLAGS.READ_MESSAGE_HISTORY,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.VIEW_CHANNEL
]);

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
        
        const reason = args.slice(2).join(' ');
        const member = await getMentions(message, 'members');

        if (!member)
            return this.Embed.fail('Failed to fetch the member, sorry. 😕\n Are they in the guild?');
        else if (!hierarchy(message.member, member))
            return this.Embed.fail(`You can't warn ${member}! 🤣`);
        else if (!hierarchy(message.guild.me, member))
            return this.Embed.fail(`I can't warn ${member}! 😦`);

        const { rows } = await pool.query<WarnInsert>(`
            WITH warns AS (
                SELECT id, k_points, k_ts
                FROM kbWarns
                WHERE kbWarns.k_guild_id = $1::text AND kbWarns.k_user_id = $2::text
            ), inserted AS (
                INSERT INTO kbWarns (
                    k_guild_id, 
                    k_user_id, 
                    k_points
                ) VALUES (
                    $1::text, 
                    $2::text, 
                    $3::smallint
                ) RETURNING k_points, id, k_ts
            )

            SELECT k_ts, inserted.id AS insertedId, inserted.k_points AS insertedPoints FROM inserted

            UNION ALL

            SELECT k_ts, warns.id AS warnsId, warns.k_points as warnPoints FROM warns
            ORDER BY k_ts DESC;
        `, [message.guild.id, member.id, points]);

        if (rows.length === 0)
            return this.Embed.fail(`Yeah, I'm not really sure what happened. 🤯`);

        const totalPoints = rows.reduce((a, b) => a + b.insertedpoints, 0);
        const k_id = rows[0].insertedid;
     
        // old warnings should not be nullified, subsequent warnings will each result in a kick.
        if (settings.max_warning_points <= totalPoints) {
            try {
                await member.kick(reason || undefined);
            } catch {
                return this.Embed.fail(`Member was warned (${inlineCode(k_id)}) but an error prevented me from kicking them.`);
            }

            await message.reply({ 
                embeds: [
                    this.Embed.success(
                    `${member} was automatically kicked from the server for having ` + 
                    `${totalPoints.toLocaleString()} warning point${plural(totalPoints)} (#${inlineCode(k_id)}).`
                    )
                ]
            });
        } else {
            await message.reply({ 
                embeds: [
                    this.Embed.success(`
                    Gave ${member} ${points.toLocaleString()} warning point${plural(points)} (${inlineCode(k_id)}).
                    Member has ${totalPoints.toLocaleString()} points total.
                    `)
                ]
            });
        }

        if (settings.mod_log_channel !== null) {
            const channel = message.guild.channels.cache.get(settings.mod_log_channel);
            if (!isText(channel) || !hasPerms(channel, message.guild.me, perms))
                return;

            return channel.send({ 
                embeds: [
                    this.Embed.success(`
                    **Offender:** ${member}
                    **Reason:** ${inlineCode(reason.length > 0 ? reason.slice(0, 100) : 'No reason given.')}
                    **Staff:** ${message.member}
                    **Points:** ${points} warning point${plural(points)} given.
                    **Kicked:** ${settings.max_warning_points <= totalPoints ? 'Yes' : 'No'} (${totalPoints.toLocaleString()} total point${plural(totalPoints)}).
                    **ID:** ${inlineCode(k_id)}
                    `).setTitle('Member Warned')
                ] 
            });
        }
    }
}