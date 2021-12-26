import { Message, Permissions, TextChannel } from 'discord.js';
import { isText } from '../../lib/types/Discord.js.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Command } from '#khaf/Command';
import { pool } from '#khaf/database/Postgres.js';
import { client } from '#khaf/database/Redis.js';

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

    async init(message: Message<true>) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.perms(
                message.channel as TextChannel,
                message.member,
                Permissions.FLAGS.ADMINISTRATOR
            );
        } 

        const channel = await getMentions(message, 'channels') ?? message.channel;
        if (!channel || !isText(channel)) {
            return this.Embed.error(`Channel isn't cached or the ID is incorrect.`);
        }

        const { rows } = await pool.query<kGuild>(`
            UPDATE kbGuild 
            SET mod_log_channel = $1::text
            WHERE kbGuild.guild_id = $2::text
            RETURNING *;
        `, [channel.id, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({ ...rows[0] }), 'EX', 600);

        return this.Embed.ok(`
        Set public mod-logging channel to ${channel}!
        `);
    }
}