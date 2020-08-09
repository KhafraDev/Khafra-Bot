import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { pool } from "../../Structures/Database/Mongo";
import { Pocket } from "../../Backend/CommandStructures/Pocket";
import { PocketGetResults, PocketArticle } from "../../Backend/types/Pocket";

export default class extends Command {
    constructor() {
        super(
            { name: 'pocketget', folder: 'Pocket' },
            [
                'Pocket: retrieve your saved items!',
                ''
            ],
            [ /* No extra perms needed */ ],
            60
        );
    }

    async init(message: Message) {
        const client = await pool.pocket.connect();
        const collection = client.db('khafrabot').collection('pocket');

        const user = await collection.findOne({ id: message.author.id });
        if(!user) {
            return message.channel.send(Embed.fail(`
            You haven't set-up Pocket integration!

            Try using the \`\`pocket\`\` command for more information.
            `));
        }

        let latest: PocketGetResults;
        try {
            const pocket = new Pocket(user);
            latest = await pocket.getList();
        } catch(e) {
            return message.channel.send(Embed.fail(`
            An unexpected error occurred!
            
            \`\`\`${(e as Error).toString()}\`\`\`
            `));
        }

        const formatted = (Object.values(latest.list) as unknown as PocketArticle[]) // TypeScript isn't intelligent
            .map(item => `[${item.resolved_title}](${item.resolved_url})`)
            .join('\n');
        
        const embed = Embed.success(formatted)
            .setAuthor(message.author.username + '\'s latest saves', message.author.displayAvatarURL(), 'https://getpocket.com/')

        return message.channel.send(embed);
    }
}