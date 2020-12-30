import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { reddit } from '../../lib/Backend/BadMeme/BadMeme.js';
import { RedditPostMin } from '../../lib/Backend/BadMeme/types/BadMeme';
import { isDM } from '../../lib/types/Discord.js.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Get a bad meme! Idea from NotSoBot.',
                'thesimppolice', ''
            ],
			{
                name: 'badmeme',
                folder: 'Fun',
                args: [0, 1]
            }
        );
    }

    async init(message: Message, args: string[]) {
        let res: RedditPostMin;
        try {
            res = await reddit(
                args[0] ?? 'dankmemes', 
                isDM(message.channel) ? true : message.channel.nsfw
            );
        } catch(e) {
            return message.reply(this.Embed.fail(`
            ${e.toString()}
            NSFW images will only work if the channel is marked \`\`nsfw\`\`!
            `));
        }

        return message.reply(this.Embed.success().setImage(res.url));
    }
}