import { Command } from '../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { pool } from '../../Structures/Database/Postgres.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { isText } from '../../lib/types/Discord.js.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { client } from '../../Structures/Database/Redis.js';
import { inlineCode } from '@discordjs/builders';

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

    async init(message: Message) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } 

        const channel = await getMentions(message, 'channels');
        
        if (!isText(channel)) {
            return this.Embed.fail(`${channel} is not a text channel!`);
        } else if (!hasPerms(channel, message.guild!.me, basic)) {
            return this.Embed.fail(`
            I am missing one or more of ${basic.toArray().map(p => inlineCode(p)).join(', ')} permissions!
            `);
        }

        const { rows } = await pool.query<kGuild>(`
            UPDATE kbGuild
            SET welcome_channel = $1::text
            WHERE guild_id = $2::text
            RETURNING *;
        `, [channel.id, message.guild!.id]);

        await client.set(message.guild!.id, JSON.stringify({ ...rows[0] }), 'EX', 600);
        
        return this.Embed.success(`
        You will now receive messages in ${channel} when a user joins, leaves, is kicked, or banned from the server!
        `);
    }
}