import { pool } from '#khaf/database/Postgres.js';
import { client } from '#khaf/database/Redis.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { kGuild, PartialGuild, Warning } from '#khaf/types/KhafraBot.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { isText } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { hasPerms, hierarchy } from '#khaf/utility/Permissions.js';
import { plural } from '#khaf/utility/String.js';
import { bold, inlineCode } from '@khaf/builders';
import { CommandInteraction, Permissions } from 'discord.js';
import { join } from 'path';

type WarnInsert = {
    insertedid: Warning['id']
    insertedpoints: Warning['k_points']
    k_ts: Warning['k_ts']
}

const perms = new Permissions([
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS
]);

const config = createFileWatcher({} as typeof import('../../../../config.json'), join(cwd, 'config.json'));
const defaultSettings: PartialGuild = {
    prefix: config.prefix,
    max_warning_points: 20,
    mod_log_channel: null,
    welcome_channel: null,
};

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
        } else if (interaction.guild?.me && !hierarchy(interaction.guild.me, member)) {
            return `❌ I can't warn ${member}! 😦`;
        }
        
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
        `, [interaction.guildId, member.id, points]);

        // something really bad has gone wrong...
        if (rows.length === 0) {
            return `❌ Yeah, I'm not really sure what happened. 🤯`;
        }

        const totalPoints = rows.reduce((a, b) => a + b.insertedpoints, 0);
        const k_id = rows[0].insertedid;

        let settings!: typeof defaultSettings | kGuild;
        const row = await client.get(interaction.guildId);

        if (row) {
            settings = { ...defaultSettings, ...JSON.parse(row) as kGuild };
        } else {
            const { rows } = await pool.query<kGuild>(`
                SELECT * 
                FROM kbGuild
                WHERE guild_id = $1::text
                LIMIT 1;
            `, [interaction.guildId]);

            if (rows.length !== 0) {
                void client.set(interaction.guildId, JSON.stringify(rows[0]), 'EX', 600);

                settings = { ...defaultSettings, ...rows.shift() };
            } else {
                settings = { ...defaultSettings };
            }
        }

        if (settings.max_warning_points <= totalPoints) {
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

        if (settings.mod_log_channel !== null) {
            const channel = interaction.guild.channels.cache.get(settings.mod_log_channel);
            if (!isText(channel) || !hasPerms(channel, interaction.guild.me, perms))
                return;

            return void channel.send({ 
                embeds: [
                    Embed.ok(`
                    ${bold('Offender:')} ${member}
                    ${bold('Reason:')} ${inlineCode(reason && reason.length > 0 ? reason.slice(0, 100) : 'No reason given.')}
                    ${bold('Staff:')} ${interaction.member}
                    ${bold('Points:')} ${points} warning point${plural(points)} given.
                    ${bold('Kicked:')} ${settings.max_warning_points <= totalPoints ? 'Yes' : 'No'} (${totalPoints.toLocaleString()} total point${plural(totalPoints)}).
                    ${bold('ID:')} ${inlineCode(k_id)}
                    `).setTitle('Member Warned')
                ] 
            });
        }
    }
}