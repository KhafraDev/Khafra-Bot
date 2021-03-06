import { Arguments, Command } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { isText } from '../../lib/types/Discord.js.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { kGuild } from '../../lib/types/Warnings.js';
import { client } from '../../Structures/Database/Redis.js';

const basic = new Permissions([
    'SEND_MESSAGES',
    'EMBED_LINKS',
    'VIEW_CHANNEL'
]);

@RegisterCommand
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

    async init(message: Message, _: Arguments, settings: kGuild) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } 

        const channel = await getMentions(message, 'channels');
        
        if (!isText(channel)) {
            return this.Embed.fail(`${channel} is not a text channel!`);
        } else if (!hasPerms(channel, message.guild.me, basic)) {
            return this.Embed.fail(`
            I am missing one or more of ${basic.toArray().map(p => `\`\`${p}\`\``).join(', ')} permissions!
            `);
        }

        await pool.query(`
            UPDATE kbGuild
            SET welcome_channel = $1::text
            WHERE guild_id = $2::text;
        `, [channel.id, message.guild.id]);

        await client.set(message.guild.id, JSON.stringify({
            ...settings,
            welcome_channel: channel.id
        }));
        
        return this.Embed.success(`
        You will now receive messages in ${channel} when a user joins, leaves, is kicked, or banned from the server!
        `);
    }
}