import { Command } from '../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { isText, Message } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { client } from '../../Structures/Database/Redis.js';
import { kGuild } from '../../lib/types/KhafraBot.js';

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

    async init(message: Message) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } 

        const channel = await getMentions(message, 'channels') ?? message.channel;
        if (!channel || !isText(channel)) {
            return this.Embed.fail(`Channel isn't cached or the ID is incorrect.`);
        }

        const { rows } = await pool.query<kGuild>(`
            UPDATE kbGuild 
            SET mod_log_channel = $1::text
            WHERE kbGuild.guild_id = $2::text
            RETURNING *;
        `, [channel.id, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({ ...rows[0] }), 'EX', 600);

        return this.Embed.success(`
        Set public mod-logging channel to ${channel}!
        `);
    }
}