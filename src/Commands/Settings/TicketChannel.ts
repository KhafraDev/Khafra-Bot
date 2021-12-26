import { Arguments, Command } from '#khaf/Command';
import { isCategory, isExplicitText } from '../../lib/types/Discord.js.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { getMentions } from '#khaf/utility/Mentions.js';
import { pool } from '#khaf/database/Postgres.js';
import { client } from '#khaf/database/Redis.js';
import { Permissions, TextChannel, Message } from 'discord.js';
import { hasPerms } from '#khaf/utility/Permissions.js';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Select a channel to create private ticket threads on (if the server has enough boosts), ' +
                'or a category channel to create ticket channels in.',
                '866022233330810930 [channel id]',
                '#general [channel mention]'
            ],
			{
                name: 'ticketchannel',
                folder: 'Settings',
                aliases: ['ticketchannels'],
                args: [1, 1],
                ratelimit: 10,
                guildOnly: true
            }
        );
    }

    async init(message: Message<true>, _args: Arguments, settings: kGuild) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.perms(
                message.channel as TextChannel,
                message.member,
                Permissions.FLAGS.ADMINISTRATOR
            );
        }
        
        /** guild can use private threads */
        const privateThreads = /^TIER_[2-9]$/.test(message.guild.premiumTier);

        const ticketChannel = await getMentions(message, 'channels');
        
        if (!isExplicitText(ticketChannel) && !isCategory(ticketChannel)) {
            return this.Embed.error(`${ticketChannel ?? 'None'} is not a text or category channel!`);
        } else if (isExplicitText(ticketChannel) && !privateThreads) {
            return this.Embed.error(`This guild cannot use private threads, please use a category channel instead!`);
        }

        const { rows } = await pool.query<kGuild>(`
            UPDATE kbGuild
            SET ticketChannel = $1::text
            WHERE guild_id = $2::text
            RETURNING *;
        `, [ticketChannel.id, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({ ...rows[0] }), 'EX', 600);

        return this.Embed.ok(`Changed the default ticket channel to ${ticketChannel} (was: ${settings.ticketchannel ?? 'N/A'})!`);
    }
}