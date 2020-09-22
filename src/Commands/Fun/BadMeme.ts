import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { reddit } from "../../lib/Backend/BadMeme/BadMeme";
import { RedditChildren, RedditNotFound } from "../../lib/Backend/BadMeme/types/BadMeme";
import { Response } from "node-fetch";

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
            const err = e as Response | RedditNotFound
            return message.channel.send(this.Embed.fail(
                'status' in err ? `Received status ${err.status} (${err.statusText})!` : (err.message ?? '¯\\_(ツ)_/¯')
            ));
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