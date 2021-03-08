import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { badmeme } from '../../lib/Backend/BadMeme/BadMeme.js';
import { isDM } from '../../lib/types/Discord.js.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a bad meme! Idea from NotSoBot.',
                'pewdiepiesubmissions', ''
            ],
			{
                name: 'badmeme',
                folder: 'Fun',
                args: [0, 1],
            }
        );
    }

    async init(message: Message, args: string[]) {        
        const res = await badmeme(args[0], isDM(message.channel) || message.channel.nsfw);
        if (!res)
            return this.Embed.fail(`
            No image posts found in this subreddit.
            
            If the channel isn't set to NSFW, adult subreddits won't work!
            `);
        return res.url;
    }
}