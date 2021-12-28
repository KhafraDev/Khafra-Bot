import { Message, Permissions, TextChannel } from 'discord.js';
import { isText } from '#khaf/utility/Discord.js';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Command } from '#khaf/Command';
import { pool } from '#khaf/database/Postgres.js';
import { client } from '#khaf/database/Redis.js';

const basic = new Permissions([
    Permissions.FLAGS.VIEW_CHANNEL,
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS
]);

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the welcome channel for messages when a user leaves, joins, or is kicked from the guild!',
                '#general', '705896428287033375'
            ],
			{
                name: 'welcome',
                folder: 'Settings',
                args: [1, 1],
                guildOnly: true,
                aliases: [ 'welcomechannel' ]
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

        const channel = await getMentions(message, 'channels');
        
        if (!isText(channel)) {
            return this.Embed.error(`${channel} is not a text channel!`);
        } else if (!hasPerms(channel, message.guild?.me, basic)) {
            return this.Embed.perms(channel, message.guild.me, basic);
        }

        const { rows } = await pool.query<kGuild>(`
            UPDATE kbGuild
            SET welcome_channel = $1::text
            WHERE guild_id = $2::text
            RETURNING *;
        `, [channel.id, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({ ...rows[0] }), 'EX', 600);
        
        return this.Embed.ok(`
        You will now receive messages in ${channel} when a user joins, leaves, is kicked, or banned from the server!
        `);
    }
}