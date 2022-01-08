import { sql } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { Warning } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { interactionGetGuildSettings, postToModLog } from '#khaf/utility/Discord/Interaction Util.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { hierarchy } from '#khaf/utility/Permissions.js';
import { plural } from '#khaf/utility/String.js';
import { bold, inlineCode } from '@khaf/builders';
import { CommandInteraction, Permissions } from 'discord.js';

type WarnInsert = {
    insertedid: Warning['id']
    insertedpoints: Warning['k_points']
    k_ts: Warning['k_ts']
}

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'warns',
            name: 'warn'
        });
    }

    async handle (interaction: CommandInteraction) {
        if (!interaction.inCachedGuild()) {
            return `❌ The bot must be re-invited with all permissions to use this command.`;
        }

        const points = interaction.options.getInteger('points', true);
        const reason = interaction.options.getString('reason');
        const member = interaction.options.getMember('member', true);

        if (
            member.permissions.has(Permissions.FLAGS.KICK_MEMBERS) ||
            member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
        ) {
            return `❌ This member cannot be warned!`;
        } else if (!hierarchy(interaction.member, member)) {
            return `❌ You can't warn ${member}!`;
        } else if (interaction.guild.me && !hierarchy(interaction.guild.me, member)) {
            return `❌ I can't warn ${member}! 😦`;
        }
        
        const rows = await sql<WarnInsert[]>`
            WITH warns AS (
                SELECT id, k_points, k_ts
                FROM kbWarns
                WHERE
                    kbWarns.k_guild_id = ${interaction.guildId}::text AND
                    kbWarns.k_user_id = ${member.id}::text
            ), inserted AS (
                INSERT INTO kbWarns (
                    k_guild_id, 
                    k_user_id, 
                    k_points
                ) VALUES (
                    ${interaction.guildId}::text, 
                    ${member.id}::text, 
                    ${points}::smallint
                ) RETURNING k_points, id, k_ts
            )

            SELECT k_ts, inserted.id AS insertedId, inserted.k_points AS insertedPoints FROM inserted

            UNION ALL

            SELECT k_ts, warns.id AS warnsId, warns.k_points as warnPoints FROM warns
            ORDER BY k_ts DESC;
        `;

        // something really bad has gone wrong...
        if (rows.length === 0) {
            return `❌ Yeah, I'm not really sure what happened. 🤯`;
        }

        const totalPoints = rows.reduce((a, b) => a + b.insertedpoints, 0);
        const k_id = rows[0].insertedid;

        const settings = await interactionGetGuildSettings(interaction);

        if (settings && settings.max_warning_points <= totalPoints) {
            const [kickError] = await dontThrow(member.kick(reason || undefined));
            
            if (kickError !== null) {
                return `✅ Member was warned (${inlineCode(k_id)}) but an error prevented me from kicking them.`;
            }

            await interaction.editReply({ 
                content: 
                    `${member} was automatically kicked from the server for having ` + 
                    `${totalPoints.toLocaleString()} warning point${plural(totalPoints)} (#${inlineCode(k_id)}).`
            });
        } else {
            await interaction.editReply({ 
                content: 
                    `Gave ${member} ${points.toLocaleString()} warning point${plural(points)} (${inlineCode(k_id)}).` + 
                    ` Member has ${totalPoints.toLocaleString()} points total.`
            });
        }

        const kicked = settings && settings.max_warning_points <= totalPoints ? 'Yes' : 'No';
        const embeds = [
            Embed.ok(`
            ${bold('Offender:')} ${member}
            ${bold('Reason:')} ${inlineCode(reason && reason.length > 0 ? reason.slice(0, 100) : 'No reason given.')}
            ${bold('Staff:')} ${interaction.member}
            ${bold('Points:')} ${points} warning point${plural(points)} given.
            ${bold('Kicked:')} ${kicked} (${totalPoints.toLocaleString()} total point${plural(totalPoints)}).
            ${bold('ID:')} ${inlineCode(k_id)}
            `).setTitle('Member Warned')
        ];

        return void postToModLog(interaction, embeds, settings);
    }
}