import { cache } from '#khaf/cache/Settings.js';
import { Command } from '#khaf/Command';
import { sql } from '#khaf/database/Postgres.js';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { isText } from '#khaf/utility/Discord.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Message, Permissions } from 'discord.js';

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
                message.channel,
                message.member,
                Permissions.FLAGS.ADMINISTRATOR
            );
        } 

        const channel = await getMentions(message, 'channels');
        
        if (!isText(channel)) {
            return this.Embed.error(`${channel} is not a text channel!`);
        } else if (!hasPerms(channel, message.guild.me, basic)) {
            return this.Embed.perms(channel, message.guild.me, basic);
        }

        const rows = await sql<kGuild[]>`
            UPDATE kbGuild
            SET welcome_channel = ${channel.id}::text
            WHERE guild_id = ${message.guildId}::text
            RETURNING *;
        `;

        cache.set(message.guild.id, rows[0]);
        
        return this.Embed.ok(`
        You will now receive messages in ${channel} when a user joins, leaves, is kicked, or banned from the server!
        `);
    }
}