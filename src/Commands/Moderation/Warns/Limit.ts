import { inlineCode } from '@khaf/builders';
import { Message, Permissions, TextChannel } from 'discord.js';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { Range } from '#khaf/utility/Valid/Number.js';
import { Arguments, Command } from '#khaf/Command';
import { pool } from '#khaf/database/Postgres.js';
import { client } from '#khaf/database/Redis.js';

const inRange = Range({ min: 0, max: 32767, inclusive: true }); // small int

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the amount of warning points it requires before a member is kicked. Max = 32,767.',
                '100',
                '20',
                '32767'
            ],
			{
                name: 'warnlimit',
                aliases: [ 'limit', 'setwarn' ],
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message<true>, { args }: Arguments) {
        const newAmount = Number(args[0]!);

        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.perms(
                message.channel as TextChannel,
                message.member,
                Permissions.FLAGS.ADMINISTRATOR
            );
        else if (!inRange(newAmount)) 
            return this.Embed.error(`An invalid number of points was provided, try with a positive whole number instead!`);

        const { rows } = await pool.query<kGuild>(`
            UPDATE kbGuild
            SET max_warning_points = $1::smallint
            WHERE guild_id = $2::text
            RETURNING *;
        `, [newAmount, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({ ...rows[0] }), 'EX', 600);

        return this.Embed.ok(`Set the max warning points limit to ${inlineCode(newAmount.toLocaleString())}!`);
    }
}