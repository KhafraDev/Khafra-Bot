import { Command, Arguments } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { Pocket } from '@khaf/pocket';
import { URL } from 'url';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { pool } from '../../../Structures/Database/Postgres.js';

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
                'Pocket: add an article, video, or image to your saved items!',
                'https://www.bbc.com/culture/article/20160819-the-21st-centurys-100-greatest-films The 21st Century’s 100 greatest films'
            ],
			{
                name: 'pocketadd',
                folder: 'Pocket',
                args: [1]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const { rows } = await pool.query<PocketUser>(`
            SELECT access_token, request_token, username
            FROM kbPocket
            WHERE user_id = $1::text
            LIMIT 1;
        `, [message.member.id]);

        if (rows.length === 0)
            return this.Embed.fail(`
            You haven't set-up Pocket integration!

            Try using the \`\`pocket\`\` command for more information.
            `);

        const pocket = new Pocket(rows.shift()!);
        const added = await pocket.add(new URL(args[0]), args.slice(1).join(' ') || null);

        return this.Embed.success()
            .setTitle(added.item.title)
            .setAuthor(
                added.item.domain_metadata.name ?? message.author.username, 
                added.item.domain_metadata.logo, 
                added.item.resolved_normal_url
            )
            .setDescription(`
            Added [${added.item.title}](${added.item.resolved_normal_url}) to your Pocket list!
            \`\`\`${added.item.excerpt?.slice(0, 1024) ?? 'N/A'}\`\`\`
            `)
            .setTimestamp(new Date(added.item.date_published))
            .setFooter('Published');
    }
}