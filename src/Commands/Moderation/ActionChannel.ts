import { Arguments, Command } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { isText } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { client } from '../../Structures/Database/Redis.js';
import { kGuild } from '../../lib/types/Warnings.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the mod action log channel.',
                '#channel',
                '772957951941673000'
            ],
			{
                name: 'actionchannel',
                aliases: [ 'modlog', 'modlogs' ],
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, _: Arguments, settings: kGuild) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } 

        const channel = await getMentions(message, 'channels') ?? message.channel;
        if (!channel || !isText(channel)) {
            return this.Embed.fail(`Channel isn't cached or the ID is incorrect.`);
        }

        await pool.query(`
            UPDATE kbGuild 
            SET mod_log_channel = $1::text
            WHERE kbGuild.guild_id = $2::text;
        `, [channel.id, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({
            ...settings,
            mod_log_channel: channel.id
        }));

        return this.Embed.success(`
        Set public mod-logging channel to ${channel}!
        `);
    }
}