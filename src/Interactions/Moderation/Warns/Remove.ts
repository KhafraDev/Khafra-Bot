import { pool } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { kGuild, PartialGuild, Warning } from '#khaf/types/KhafraBot.js';
import { bold, inlineCode } from '@khaf/builders';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { CommandInteraction, Permissions } from 'discord.js';
import { join } from 'path';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { client } from '#khaf/database/Redis.js';
import { isText } from '#khaf/utility/Discord.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { plural } from '#khaf/utility/String.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';

interface WarningDel {
    id: Warning['id']
    k_points: Warning['k_points']
    k_user_id: Warning['k_user_id']
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
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
            name: 'remove'
        });
    }

    async handle (interaction: CommandInteraction) {
        if (!interaction.inCachedGuild()) {
            return `❌ The bot must be re-invited with all permissions to use this command.`;
        }

        const uuid = interaction.options.getString('id', true);

        if (!uuidRegex.test(uuid)) {
            return '❌ That ID is not formatted correctly, please use a valid ID next time!';
        }

        const { rows: deleted } = await pool.query<WarningDel>(`
            DELETE FROM kbWarns
            WHERE 
                kbWarns.id = $1::uuid AND
                kbWarns.k_guild_id = $2::text
            RETURNING id, k_points, k_user_id;
        `, [uuid.toUpperCase(), interaction.guild.id]);

        if (deleted.length === 0) {
            return '❌ No warning with that ID could be found in the guild!';
        }

        await interaction.editReply({ 
            content: `Warning ${inlineCode(deleted[0].id)} has been removed!`
        });

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

        if (settings.mod_log_channel !== null) {
            const channel = interaction.guild.channels.cache.get(settings.mod_log_channel);
            if (!isText(channel) || !hasPerms(channel, interaction.guild.me, perms))
                return;

            return void channel.send({ 
                embeds: [
                    Embed.ok(`
                    ${bold('Removed From:')} ${deleted[0].k_user_id}
                    ${bold('Staff:')} ${interaction.user}
                    ${bold('Points:')} ${deleted[0].k_points} warning point${plural(deleted[0].k_points)} removed.
                    ${bold('ID:')} ${inlineCode(uuid)}
                    `).setTitle('Warning Removed')
                ]
            });
        }
    }
}