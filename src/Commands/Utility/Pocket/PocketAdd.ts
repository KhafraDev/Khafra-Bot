import { Arguments, Command } from '#khaf/Command';
import { sql } from '#khaf/database/Postgres.js';
import { URLFactory } from '#khaf/utility/Valid/URL.js';
import { codeBlock, inlineCode, type UnsafeEmbed } from '@discordjs/builders';
import { Pocket } from '@khaf/pocket';
import { Message } from 'discord.js';

interface PocketUser {
    access_token: string
    request_token: string
    username: string
}

export class kCommand extends Command {
    constructor () {
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

    async init (message: Message, { args }: Arguments): Promise<UnsafeEmbed> {
        const rows = await sql<PocketUser[]>`
            SELECT access_token, request_token, username
            FROM kbPocket
            WHERE user_id = ${message.author.id}::text
            LIMIT 1;
        `;

        if (rows.length === 0)
            return this.Embed.error(`
            You haven't set-up Pocket integration!

            Try using the ${inlineCode('pocket')} command for more information.
            `);

        const pocket = new Pocket(rows.shift());
        const article = URLFactory(args[0]);
        if (article === null)
            return this.Embed.error('That\'s not an article URL, try again!');
        const added = await pocket.add(article, args.slice(1).join(' '));

        return this.Embed.ok()
            .setTitle(added.item.title)
            .setAuthor({
                name: added.item.domain_metadata?.name ?? message.author.username,
                url: added.item.domain_metadata?.logo,
                iconURL: added.item.resolved_normal_url
            })
            .setDescription(`
            Added [${added.item.title}](${added.item.resolved_normal_url}) to your Pocket list!
            ${codeBlock(added.item.excerpt?.slice(0, 1024) ?? 'N/A')}
            `)
            .setTimestamp(new Date(added.item.date_published))
            .setFooter({ text: 'Published' });
    }
}