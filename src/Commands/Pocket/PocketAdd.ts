import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { Pocket } from "../../lib/Backend/Pocket/Pocket";
import { PocketAddResults } from "../../lib/Backend/Pocket/types/Pocket";
import { URL } from "url";
import { PocketUser } from "../../lib/types/Collections";

export default class extends Command {
    constructor() {
        super(
            [
                'Pocket: add an article, video, or image to your saved items!',
                'https://www.bbc.com/culture/article/20160819-the-21st-centurys-100-greatest-films The 21st Century’s 100 greatest films'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'pocketadd',
                folder: 'Pocket',
                args: [1]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 1) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const client = await pool.pocket.connect();
        const collection = client.db('khafrabot').collection('pocket');

        const user = await collection.findOne({ id: message.author.id }) as PocketUser;
        if(!user) {
            return message.channel.send(Embed.fail(`
            You haven't set-up Pocket integration!

            Try using the \`\`pocket\`\` command for more information.
            `));
        }

        let url: URL;
        try {
            url = new URL(args[0]);
        } catch {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        let added: PocketAddResults;
        try {
            const pocket = new Pocket(user);
            added = await pocket.add(url.toString(), args.length > 1 ? args.slice(1).join(' ') : null)
        } catch(e) {
            return message.channel.send(Embed.fail(`
            An unexpected error occurred!
            
            \`\`\`${(e as Error).toString()}\`\`\`
            `));
        }

        const embed = Embed.success()
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

        return message.channel.send(embed);
    }
}