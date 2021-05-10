import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the channel to post rules to.',
                '#rules',
                '705894556205580499'
            ],
			{
                name: 'change',
                aliases: [ 'changechannel', 'rulechannel' ],
                folder: 'Rules',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, _args: Arguments) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.missing_perms(true);

        const channel = await getMentions(message, 'channels');
        if (!isText(channel)) {
            return this.Embed.fail(`Not a text channel.`);
        }

        await pool.query(`
            UPDATE kbGuild 
            SET rules_channel = $1::text
            WHERE kbGuild.guild_id = $2::text;
        `, [channel.id, message.guild.id]);

        return this.Embed.success(`
        The rules will now be posted to ${channel}!
        `);
    }
}