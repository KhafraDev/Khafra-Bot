import { Command, Arguments } from '../../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { Range } from '../../../lib/Utility/Range.js';
import { validateNumber } from '../../../lib/Utility/Valid/Number.js';
import { client } from '../../../Structures/Database/Redis.js';
import { kGuild } from '../../../lib/types/KhafraBot.js';
import { Message } from '../../../lib/types/Discord.js.js';

const range = Range(0, 32767, true); // small int

@RegisterCommand
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

    async init(message: Message, { args }: Arguments) {
        const newAmount = Number(args[0]!);

        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.missing_perms(true);
        else if (!range.isInRange(newAmount) || !validateNumber(newAmount)) 
            return this.Embed.fail(`An invalid number of points was provided, try with a positive whole number instead!`);

        const { rows } = await pool.query<kGuild>(`
            UPDATE kbGuild
            SET max_warning_points = $1::smallint
            WHERE guild_id = $2::text
            RETURNING *;
        `, [newAmount, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({ ...rows[0] }), 'EX', 600);

        return this.Embed.success(`Set the max warning points limit to \`\`${newAmount.toLocaleString()}\`\`!`);
    }
}