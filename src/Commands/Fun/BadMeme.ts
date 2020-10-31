import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { reddit } from "../../lib/Backend/BadMeme/BadMeme.js";
import { RedditChildren } from "../../lib/Backend/BadMeme/types/BadMeme";

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
        let res: RedditChildren;
        try {
            res = await reddit(args[0] ?? 'dankmemes', message.channel.type === 'dm' ? true : message.channel.nsfw);
        } catch(e) {
            return message.channel.send(this.Embed.fail(e.message ?? 'An unexpected error occurred!'));
        }

        if(!res) {
            return message.channel.send(this.Embed.fail(
                'No images found! NSFW images will only work if the channel is marked ``nsfw``!'
            ));
        }

        const embed = this.Embed.success()
            .setImage(res.data.url);

        return message.channel.send(embed);
    }
}