import { Arguments, Command } from '../../Structures/Command.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { isCategory, isText, Message } from '../../lib/types/Discord.js.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { client } from '../../Structures/Database/Redis.js';

@RegisterCommand
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
                name: 'ticket',
                folder: 'Settings',
                args: [1, 1],
                ratelimit: 10
            }
        );
    }

    async init(message: Message, _args: Arguments, settings: kGuild) {
        /** guild can use private threads */
        const privateThreads = /^TIER_[2-9]$/.test(message.guild.premiumTier);

        const ticketChannel = await getMentions(message, 'channels');
        
        if (!isText(ticketChannel) && !isCategory(ticketChannel)) {
            return this.Embed.fail(`${ticketChannel ?? 'None'} is not a text or category channel!`);
        } else if (isText(ticketChannel) && !privateThreads) {
            return this.Embed.fail(`This guild cannot use private threads, please use a category channel instead!`);
        }

        await pool.query(`
            UPDATE kbGuild
            SET ticketChannel = $1::text
            WHERE guild_id = $2::text;
        `, [ticketChannel.id, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({
            ...settings,
            ticketChannel: ticketChannel.id
        } as kGuild)); // TODO(@KhafraDev): add durations to all of these client.sets!!!

        return this.Embed.success(`Changed the default ticket channel to ${ticketChannel} (was: ${settings.ticketChannel ?? 'N/A'})!`);
    }
}