import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';

import { pool } from '../../Structures/Database/Mongo.js';
import { Pocket } from '../../lib/Backend/Pocket/Pocket.js';
import { PocketAddResults } from '../../lib/Backend/Pocket/types/Pocket';
import { URL } from 'url';
import { PocketUser } from '../../lib/types/Collections';

export default class extends Command {
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

    async init(message: Message, args: string[]) {
        const client = await pool.pocket.connect();
        const collection = client.db('khafrabot').collection('pocket');

        const user = await collection.findOne<PocketUser>({ id: message.author.id });
        if(!user) {
            return message.reply(this.Embed.fail(`
            You haven't set-up Pocket integration!

            Try using the \`\`pocket\`\` command for more information.
            `));
        }

        let url: URL;
        try {
            url = new URL(args[0]);
        } catch {
            return message.reply(this.Embed.generic());
        }

        let added: PocketAddResults;
        try {
            const pocket = new Pocket(user);
            added = await pocket.add(url.toString(), args.length > 1 ? args.slice(1).join(' ') : null)
        } catch(e) {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
            
        }

        const embed = this.Embed.success()
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

        return message.reply(embed);
    }
}