import { Command, Arguments } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { Pocket } from '@khaf/pocket';
import { pool } from '../../../Structures/Database/Postgres.js';
import { URLFactory } from '../../../lib/Utility/Valid/URL.js';
import { codeBlock, inlineCode } from '@khaf/builders';

interface PocketUser {
    access_token: string 
    request_token: string 
    username: string
}

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
        `, [message.member!.id]);

        if (rows.length === 0)
            return this.Embed.error(`
            You haven't set-up Pocket integration!

            Try using the ${inlineCode('pocket')} command for more information.
            `);

        const pocket = new Pocket(rows.shift());
        const article = URLFactory(args[0]);
        if (article === null)
            return this.Embed.error(`That's not an article URL, try again!`);
        const added = await pocket.add(article, args.slice(1)?.join(' '));

        return this.Embed.ok()
            .setTitle(added.item.title)
            .setAuthor(
                added.item.domain_metadata?.name ?? message.author.username, 
                added.item.domain_metadata?.logo, 
                added.item.resolved_normal_url
            )
            .setDescription(`
            Added [${added.item.title}](${added.item.resolved_normal_url}) to your Pocket list!
            ${codeBlock(added.item.excerpt?.slice(0, 1024) ?? 'N/A')}
            `)
            .setTimestamp(new Date(added.item.date_published))
            .setFooter('Published');
    }
}