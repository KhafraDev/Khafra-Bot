import { Arguments, Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { Giveaway } from '../../../lib/types/KhafraBot.js';
import { DiscordAPIError, Permissions } from 'discord.js';
import { hyperlink, inlineCode } from '@khaf/builders';
import { isText, Message } from '../../../lib/types/Discord.js.js';
import { time } from '@khaf/builders';
import { hasPerms } from '../../../lib/Utility/Permissions.js';

type GiveawayRow = Pick<Giveaway, 'guildid' | 'messageid' | 'channelid' | 'initiator' | 'id' | 'enddate' | 'prize'>;

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Giveaway: delete a giveaway that is ongoing.',
            ],
			{
                name: 'giveaway:delete',
                folder: 'Giveaways',
                aliases: ['giveaways:delete'],
                args: [0, 1],
                guildOnly: true,
                permissions: [
                    Permissions.FLAGS.READ_MESSAGE_HISTORY
                ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        if (args.length === 0 || (args.length === 1 && args[0].toLowerCase().endsWith('delete'))) {
            const { rows } = await pool.query<GiveawayRow, string[]>(`
                SELECT guildId, messageId, channelId, initiator, endDate, prize, id
                FROM kbGiveaways
                WHERE guildId = $1::text AND initiator = $2::text
                ORDER BY endDate ASC
                LIMIT 10;
            `, [message.guild.id, message.member.id]);
            
            let str = '';
            for (const row of rows) {
                const url = `https://discord.com/channels/${row.guildid}/${row.channelid}/${row.messageid}`;
                str +=
                    `ID: ${inlineCode(row.id)}: ${hyperlink('URL', url)} ` +
                    time(row.enddate) + ' ' +
                    // uuid = 36 chars long, discord message is ~85
                    inlineCode(row.prize.length > 50 ? `${row.prize.slice(0, 50)}...` : row.prize)
                    + '\n';
            }

            return this.Embed.success(str)
                .setTitle('Your Current Giveaways');
        }

        // args can be one of
        // delete [id] [...args]
        // [id]
        const id = args.length === 1
            ? args[0]
            : args[1];

        if (!uuidRegex.test(id)) {
            return this.Embed.fail('UUID is not formatted correctly, please use a valid ID next time!');
        }

        const { rows } = await pool.query<GiveawayRow, string[]>(`
            DELETE FROM kbGiveaways
            WHERE initiator = $1::text AND id = $2::uuid
            RETURNING guildId, messageId, channelId, initiator, endDate, prize, id;
        `, [message.member.id, id]);

        try {
            const channel = await message.guild.channels.fetch(rows[0].channelid);
            if (!isText(channel)) return; // not possible
            if (hasPerms(channel, message.guild.me, Permissions.FLAGS.READ_MESSAGE_HISTORY)) {
                const msg = await channel.messages.fetch(rows[0].messageid);

                if (!msg.deletable)
                    return this.Embed.fail(`Giveaway has been deleted, but the ${hyperlink('message', msg.url)} could not be deleted.`);

                await msg.delete();
            }
        } catch (e) {
            if (e instanceof DiscordAPIError) {
                const name = e.code || e.name;
                return this.Embed.fail(`Giveaway has been deleted, but a(n) ${name} has occurred trying to delete the message.`);
            } else {
                return this.Embed.fail(`Giveaway has been deleted, but an error occurred trying to delete the message.`);
            }
        }

        return this.Embed.fail(`Giveaway ${inlineCode(rows[0].id)} has been deleted.`);
    }
}