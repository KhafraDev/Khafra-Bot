import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { Warning } from '../../../lib/types/Warnings.js';
import { getMentions, validSnowflake } from '../../../lib/Utility/Mentions.js';
import { hasPerms, hierarchy } from '../../../lib/Utility/Permissions.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { plural } from '../../../lib/Utility/String.js';

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
                name: 'warn:next',
                folder: 'Moderation',
                args: [2],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.KICK_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: GuildSettings) {
        /**
         * kbWarns.max_warning_points is a small integer, [-32768, 32767]
         * We need to make sure it's in the range!
         * @see https://www.postgresql.org/docs/9.1/datatype-numeric.html
         */

        const points = Number(args[1]);

        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.KICK_MEMBERS))
            return this.Embed.missing_perms(false, Permissions.FLAGS.KICK_MEMBERS);
        else if (
            Number.isNaN(points) ||
            !Number.isFinite(points) ||
            !Number.isInteger(points) ||
            points <= 0 || points > 32767
        )
            return this.Embed.fail(`An invalid number of points was provided, user wasn't warned!`);
        
        const member = await getMentions(message, 'members');
        if (!member)
            return this.Embed.fail('Failed to fetch the member, sorry. 😕\n Are they in the guild?');
        else if (!hierarchy(message.member, member))
            return this.Embed.fail(`You can't warn ${member}! 🤣`);
        else if (!hierarchy(message.guild.me, member))
            return this.Embed.fail(`I can't warn ${member}! 😦`);
    
        await pool.query<Warning>(`
            INSERT INTO kbWarns (
                k_guild_id, k_user_id, k_points
            ) VALUES (
                $1::text, $2::text, $3::smallint
            );
        `, [message.guild.id, member.id, points]);

        // warns the user was already given
        const { rows: allWarns } = await pool.query<{ max_warning_points: number, k_points: number, id: number }>(`
            SELECT kbWarns.id, max_warning_points, k_points FROM kbGuild
            INNER JOIN kbWarns
            ON kbGuild.guild_id = kbWarns.k_guild_id
            WHERE kbGuild.guild_id = $1::text AND kbWarns.k_user_id = $2::text;
        `, [message.guild.id, member.id]);
        
        // total warning points a member has
        const total = allWarns.reduce((a, b) => a + b.k_points, 0);
        // number of warning points it takes for a member to be auto-kicked
        const toBeKicked = allWarns.find(p => typeof p.max_warning_points === 'number').max_warning_points;
        // ids are incremental, the largest one is the newest.
        const id = Math.max(...allWarns.map(w => w.id));

        // old warnings should not be nullified, subsequent warnings will each result in a kick.
        if (toBeKicked <= total) {
            try {
                await member.kick();
            } catch {
                return this.Embed.fail(`Member was warned (#${id}) but an error prevented me from kicking them.`);
            }

            await message.reply(this.Embed.success(`
            ${member} was automatically kicked from the server for having ${total.toLocaleString()} warning point${plural(total)} (#${id}).
            `));
        } else {
            await message.reply(this.Embed.success(`
            Gave ${member} ${points.toLocaleString()} warning point${plural(points)} (#${id}).
            `));
        }

        if (typeof settings?.modActionLogChannel === 'string' && validSnowflake(settings.modActionLogChannel)) {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel);
            if (!isText(channel) || !hasPerms(channel, message.guild.me, logChannel))
                return;

            const reason = args.slice(2).join(' ');
            return channel.send(this.Embed.success(`
            **Offender:** ${member}
            **Reason:** ${reason.length > 0 ? reason.slice(0, 100) : 'No reason given.'}
            **Staff:** ${message.member}
            **Points:** ${points} warning point${plural(points)} given.
            **Kicked:** ${toBeKicked <= total ? 'Yes' : 'No'} (${total.toLocaleString()} total point${plural(total)}).
            **ID:** #${id}
            `).setTitle('Member Warned'));
        }
    }
}