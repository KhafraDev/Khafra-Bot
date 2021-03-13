import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { URL } from 'url';
import { getTwitterMediaURL } from '../../lib/Backend/Twitter.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get direct links to media in Tweets!',
                'https://twitter.com/expo_con/status/1362620733570998274'
            ],
			{
                name: 'twitter',
                folder: 'Utility',
                args: [1, 1],
                aliases: [ 'twit', 'twitterdownload', 'twitdl', 'twitdownload' ]
            }
        );
    }

    async init(_message: Message, args: string[]) {
        const url = new URL(args[0]);
        if (!/\/status\/\d+$/.test(url.pathname))
            return this.Embed.fail(`Invalid Twitter status!`);

        const id = url.pathname.match(/\/status\/(\d+)$/)[1];
        const media = await getTwitterMediaURL(id);

        if (!media)
            return this.Embed.fail('No media found in Tweet! This is usually due to an issue with Twitter\'s API.');
            
        return this.Embed.success(media);
    }
}