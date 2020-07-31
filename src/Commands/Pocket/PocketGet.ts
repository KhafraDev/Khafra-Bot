import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { Mongo } from "../../Structures/Database/Mongo";
import { get } from "../../Backend/CommandStructures/Pocket";
import { PocketGetResults, PocketArticle } from "../../Backend/types/Pocket.i";

export default class extends Command {
    constructor() {
        super(
            'pocketget',
            [
                'Pocket: retrieve your saved items!',
                ''
            ],
            [ /* No extra perms needed */ ],
            300
        );
    }

    async init(message: Message) {
        const client = await Mongo.connect();
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
            latest = await get(process.env.POCKET_CONSUMER_KEY, user.access_token);
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