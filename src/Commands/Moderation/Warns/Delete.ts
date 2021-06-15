import { Command, Arguments } from '../../../Structures/Command.js';
import { GuildMember, Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { kGuild } from '../../../lib/types/KhafraBot.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { Range } from '../../../lib/Utility/Range.js';
import { validateNumber } from '../../../lib/Utility/Valid/Number.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { plural } from '../../../lib/Utility/String.js';

interface WarningDel {
    k_id: number
    k_points: number
}

const logChannel = Permissions.FLAGS.SEND_MESSAGES | Permissions.FLAGS.EMBED_LINKS;
const range = Range(1, 1e6, true);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Delete a warning from someone.',
                '@user 5',
                '1234567891234567 #5'
            ],
			{
                name: 'warningsdelete',
                folder: 'Moderation',
                aliases: ['warnsdelete', 'warnsremove', 'warnremove', 'unwarn'],
                args: [2, 2],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.KICK_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: kGuild) {
        const id = Number(args[1].replace(/^#/, ''));
        if (!validateNumber(id) || !range.isInRange(id)) 
            return this.Embed.fail(`Invalid ID, list all of the warn IDs with the \`\`warns\`\` command!`);

        const member = await getMentions(message, 'members');
        if (!member || !(member instanceof GuildMember))
            return this.Embed.fail(`No member was mentioned. Try again!`);

        const { rows: deleted } = await pool.query<WarningDel>(`
            WITH deleted AS (
                DELETE FROM kbWarns
                WHERE 
                    kbWarns.k_id = $1::smallint AND
                    kbWarns.k_guild_id = $2::text AND
                    kbWarns.k_user_id = $3::text
                RETURNING k_id, k_points
            ), updated AS (
                UPDATE kbWarns
                SET k_id = k_id - 1
                WHERE k_id > (SELECT k_id FROM deleted)
                RETURNING k_id, k_points
            )

            SELECT k_id, k_points FROM deleted

            UNION ALL

            SELECT k_id, k_points FROM updated;
        `, [id, message.guild.id, member.id]);

        if (deleted.length === 0)
            return this.Embed.fail('No warning with that ID could be found in the guild!');

        await message.reply({ embeds: [this.Embed.success(`
        Warning #${deleted[0].k_id} was removed from ${member}!
        `)] });

        if (settings.mod_log_channel !== null) {
            const channel = message.guild.channels.cache.get(settings.mod_log_channel);
            if (!isText(channel) || !hasPerms(channel, message.guild.me, logChannel))
                return;

            return channel.send({ embeds: [this.Embed.success(`
            **Removed From:** ${member}
            **Staff:** ${message.member}
            **Points:** ${deleted[0].k_points} warning point${plural(deleted[0].k_points)} removed.
            **ID:** #${id}
            `).setTitle('Warning Removed')] });
        }
    }
}