import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { kGuild, Warning } from '../../../lib/types/KhafraBot.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { plural } from '../../../lib/Utility/String.js';
import { bold, inlineCode } from '@khaf/builders';

interface WarningDel {
    id: Warning['id']
    k_points: Warning['k_points']
}

const perms = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.VIEW_CHANNEL
]);
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

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

    async init(message: Message<true>, { args }: Arguments, settings: kGuild) {
        if (!uuidRegex.test(args[1])) {
            return this.Embed.error('UUID is not formatted correctly, please use a valid ID next time!');
        }

        const member = await getMentions(message, 'members');
        if (!member)
            return this.Embed.error(`No member was mentioned. Try again!`);

        const { rows: deleted } = await pool.query<WarningDel>(`
            DELETE FROM kbWarns
            WHERE 
                kbWarns.id = $1::uuid AND
                kbWarns.k_guild_id = $2::text AND
                kbWarns.k_user_id = $3::text
            RETURNING id, k_points
        `, [args[1].toLowerCase(), message.guild.id, member.id]);

        if (deleted.length === 0)
            return this.Embed.error('No warning with that ID could be found in the guild!');

        await message.reply({ 
            embeds: [
                this.Embed.ok(`Warning ${inlineCode(deleted[0].id)} was removed from ${member}!`)
            ]
        });

        if (settings.mod_log_channel !== null) {
            const channel = message.guild.channels.cache.get(settings.mod_log_channel);
            if (!isText(channel) || !hasPerms(channel, message.guild.me, perms))
                return;

            return void channel.send({ 
                embeds: [
                    this.Embed.ok(`
                    ${bold('Removed From:')} ${member}
                    ${bold('Staff:')} ${message.member}
                    ${bold('Points:')} ${deleted[0].k_points} warning point${plural(deleted[0].k_points)} removed.
                    ${bold('ID:')} ${inlineCode(args[1])}
                    `).setTitle('Warning Removed')
                ]
            });
        }
    }
}