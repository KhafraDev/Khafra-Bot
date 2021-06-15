import { Command, Arguments } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { client } from '../../Structures/Database/Redis.js';
import { kGuild } from '../../lib/types/KhafraBot.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [ 
                'GuildSettings: Change the prefix for the current guild.',
                '>>', '!!', '?'
            ],
			{
                name: 'prefix',
                folder: 'Settings',
                args: [1, 1],
                ratelimit: 10,
                guildOnly: true
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: kGuild) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR))
            return this.Embed.missing_perms(true);
        else if (args[0].length > 100)
            return this.Embed.fail(`Maximum prefix length is 100 characters!`);

        await pool.query(`
            UPDATE kbGuild
            SET prefix = $1::text
            WHERE guild_id = $2::text;
        `, [args[0]!, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({
            ...settings,
            prefix: args[0]!
        }));

        return this.Embed.success(`Updated the guild's prefix to \`\`${args[0]}\`\``);
    }
}