import { Arguments, Command } from '../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { isText, Message } from '../../lib/types/Discord.js.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { client } from '../../Structures/Database/Redis.js';

const basic = new Permissions([
    Permissions.FLAGS.SEND_MESSAGES,
    Permissions.FLAGS.EMBED_LINKS,
    Permissions.FLAGS.VIEW_CHANNEL
]);

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Sets a channel for actions done in a guild (emoji updates, role updates).',
                '#general', '705896428287033375'
            ],
			{
                name: 'logchannel',
                folder: 'Settings',
                args: [1, 1],
                guildOnly: true,
                aliases: [ 'completelogchannel' ]
            }
        );
    }

    async init(message: Message, _: Arguments, settings: kGuild) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } 

        const channel = await getMentions(message, 'channels');
        
        if (!isText(channel)) {
            return this.Embed.fail(`${channel} is not a text or news channel!`);
        } else if (!hasPerms(channel, message.guild.me, basic)) {
            return this.Embed.fail(`
            I am missing one or more of ${basic.toArray().map(p => `\`\`${p}\`\``).join(', ')} permissions!
            `);
        }

        await pool.query(`
            UPDATE kbGuild
            SET complete_log_channel = $1::text
            WHERE guild_id = $2::text;
        `, [channel.id, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({
            ...settings,
            complete_log_channel: channel.id
        } as kGuild));
        
        return this.Embed.success(`
        You will now receive messages in ${channel} when:
            • An emoji is updated.
            • A role is updated.
        `);
    }
}