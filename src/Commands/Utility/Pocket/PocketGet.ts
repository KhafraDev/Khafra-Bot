import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { Pocket } from '@khaf/pocket';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';
import { inlineCode } from '@discordjs/builders';

interface PocketUser {
    access_token: string 
    request_token: string 
    username: string
}


@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Pocket: retrieve your saved items!'
            ],
			{
                name: 'pocketget',
                folder: 'Pocket',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const { rows } = await pool.query<PocketUser>(`
            SELECT access_token, request_token, username
            FROM kbPocket
            WHERE user_id = $1::text
            LIMIT 1;
        `, [message.member!.id]);

        if (rows.length === 0)
            return this.Embed.fail(`
            You haven't set-up Pocket integration!

            Try using the ${inlineCode('pocket')} command for more information.
            `);

        const pocket = new Pocket(rows.shift());
        const latest = await pocket.getList();

        const formatted = Object.values(latest.list)
            .map(item => `[${item.resolved_title}](${item.resolved_url})`)
            .join('\n');
        
        return this.Embed.success(formatted)
            .setAuthor(message.author.username + '\'s latest saves', message.author.displayAvatarURL(), 'https://getpocket.com/')
    }
}