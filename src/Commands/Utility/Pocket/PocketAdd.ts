import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { Pocket } from '../../../lib/Backend/Pocket/Pocket.js';
import { URL } from 'url';
import { PocketUser } from '../../../lib/types/Collections';
import { RegisterCommand } from '../../../Structures/Decorator.js';

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

    async init(message: Message, args: string[]) {
        const client = await pool.pocket.connect();
        const collection = client.db('khafrabot').collection('pocket');

        const user = await collection.findOne<PocketUser>({ id: message.author.id });
        if (!user) {
            return this.Embed.fail(`
            You haven't set-up Pocket integration!

            Try using the \`\`pocket\`\` command for more information.
            `);
        }

        const url = new URL(args[0]);
        const pocket = new Pocket(user);
        const added = await pocket.add(url.toString(), args.length > 1 ? args.slice(1).join(' ') : null)

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