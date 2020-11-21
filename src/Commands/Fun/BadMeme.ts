import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { reddit } from "../../lib/Backend/BadMeme/BadMeme.js";
import { RedditPostMin } from "../../lib/Backend/BadMeme/types/BadMeme";

export default class extends Command {
    constructor() {
        super(
            [
                'Get a bad meme! Idea from NotSoBot.',
                'thesimppolice', ''
            ],
            [ /* No extra perms needed */ ],
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
                message.channel.type === 'dm' ? true : message.channel.nsfw
            );
        } catch(e) {
            return message.channel.send(this.Embed.fail(`
            ${e.toString()}
            NSFW images will only work if the channel is marked \`\`nsfw\`\`!
            `));
        }

        return message.channel.send(this.Embed.success().setImage(res.url));
    }
}