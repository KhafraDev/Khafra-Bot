import { Command, Arguments } from '../../../Structures/Command.js';
import { GuildMember, Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { Warning } from '../../../lib/types/Warnings.js';
import { getMentions, validSnowflake } from '../../../lib/Utility/Mentions.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { plural } from '../../../lib/Utility/String.js';

const logChannel = Permissions.FLAGS.SEND_MESSAGES | Permissions.FLAGS.EMBED_LINKS;

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
                name: 'warningsdelete:next',
                folder: 'Moderation',
                aliases: ['warnsdelete:next', 'warnsremove:next', 'warnremove:next', 'unwarn:next'],
                args: [2, 2],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.KICK_MEMBERS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: GuildSettings) {
        const id = Number(args[1].replace(/^#/, ''));
        if (
            Number.isNaN(id) ||
            id < 0 || !Number.isSafeInteger(id)
        ) 
            return this.Embed.fail(`Invalid ID, list all of the warn IDs with the \`\`warns\`\` command!`);

        const member = await getMentions(message, 'members');
        if (!member || !(member instanceof GuildMember))
            return this.Embed.fail(`No member was mentioned. Try again!`);

        const { rows: deleted } = await pool.query<Warning>(`
            DELETE FROM kbWarns
            WHERE 
                kbWarns.id = $1::integer AND
                kbWarns.k_guild_id = $2::text AND
                kbWarns.k_user_id = $3::text
            RETURNING *;
        `, [id, message.guild.id, member.id]);

        if (deleted.length === 0)
            return this.Embed.fail('No warning with that ID could be found in the guild!');

        await message.reply(this.Embed.success(`
        Warning #${deleted[0].id} was removed from ${member}!
        `));

        if (typeof settings?.modActionLogChannel === 'string' && validSnowflake(settings.modActionLogChannel)) {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel);
            if (!isText(channel) || !hasPerms(channel, message.guild.me, logChannel))
                return;

            return channel.send(this.Embed.success(`
            **Removed From:** ${member}
            **Staff:** ${message.member}
            **Points:** ${deleted[0].k_points} warning point${plural(deleted[0].k_points)} removed.
            **ID:** #${id}
            `).setTitle('Warning Removed'));
        }
    }
}