import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { Pocket } from '@khaf/pocket';
import { PocketUser } from '../../../lib/types/Collections';
import { RegisterCommand } from '../../../Structures/Decorator.js';

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
        const client = await pool.pocket.connect();
        const collection = client.db('khafrabot').collection('pocket');

        const user = await collection.findOne<PocketUser>({ id: message.author.id });
        if (!user) {
            return this.Embed.fail(`
            You haven't set-up Pocket integration!

            Try using the \`\`pocket\`\` command for more information.
            `);
        }

        const pocket = new Pocket(user);
        const latest = await pocket.getList();

        const formatted = Object.values(latest.list)
            .map(item => `[${item.resolved_title}](${item.resolved_url})`)
            .join('\n');
        
        return this.Embed.success(formatted)
            .setAuthor(message.author.username + '\'s latest saves', message.author.displayAvatarURL(), 'https://getpocket.com/')
    }
}