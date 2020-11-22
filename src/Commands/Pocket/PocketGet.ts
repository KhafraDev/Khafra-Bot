import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";

import { pool } from "../../Structures/Database/Mongo.js";
import { Pocket } from "../../lib/Backend/Pocket/Pocket.js";
import { PocketGetResults, PocketArticle } from "../../lib/Backend/Pocket/types/Pocket";
import { PocketUser } from "../../lib/types/Collections";

export default class extends Command {
    constructor() {
        super(
            [
                'Pocket: retrieve your saved items!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'pocketget',
                folder: 'Pocket',
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        const client = await pool.pocket.connect();
        const collection = client.db('khafrabot').collection('pocket');

        const user = await collection.findOne<PocketUser>({ id: message.author.id });
        if(!user) {
            return message.reply(this.Embed.fail(`
            You haven't set-up Pocket integration!

            Try using the \`\`pocket\`\` command for more information.
            `));
        }

        let latest: PocketGetResults;
        try {
            const pocket = new Pocket(user);
            latest = await pocket.getList();
        } catch {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        const formatted = (Object.values<PocketArticle>(latest.list))
            .map(item => `[${item.resolved_title}](${item.resolved_url})`)
            .join('\n');
        
        const embed = this.Embed.success(formatted)
            .setAuthor(message.author.username + '\'s latest saves', message.author.displayAvatarURL(), 'https://getpocket.com/')

        return message.reply(embed);
    }
}