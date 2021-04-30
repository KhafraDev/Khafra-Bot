import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { isValidNumber } from '../../../lib/Utility/Valid/Number.js';

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
                name: 'warnlimit:next',
                aliases: [ 'limit:next', 'setwarn:next' ],
                folder: 'Moderation',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        // TODO(@KhafraDev): when kbGuild is set as the guild settings parameter, 
        // we can use that to show the old vs. new limit.

        const newAmount = Number(args[0]!);

        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.missing_perms(true);
        else if (!isValidNumber(newAmount) || newAmount > 32767) // small int
            return this.Embed.fail(`An invalid number of points was provided, try with a positive whole number instead!`);

        await pool.query(`
            UPDATE kbGuild
            SET max_warning_points = $1::smallint
            WHERE guild_id = $2::text;
        `, [newAmount, message.guild.id]);

        return this.Embed.success(`Set the max warning points limit to \`\`${newAmount.toLocaleString()}\`\`!`);
    }
}