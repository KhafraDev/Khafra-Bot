import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { getTwitterMediaURL } from '../../lib/Packages/Twitter.js';
import { URLFactory } from '../../lib/Utility/Valid/URL.js';

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

    async init(_message: Message, { args }: Arguments) {
        const { hostname, pathname } = URLFactory(args[0]) ?? {};
        if (hostname !== 'twitter.com')
            return this.Embed.error('Not a Twitter status!');
        // Your username can only contain letters, numbers and '_'
        // Your username must be shorter than 15 characters.
        if (!/\/[A-z0-9_]{3,15}\/status\/\d{17,19}$/.test(pathname ?? ''))
            return this.Embed.error(`Invalid Twitter status!`);

        const id = /\/(\d+)$/.exec(pathname!)![1];
        const media = await getTwitterMediaURL(id);

        if (!media)
            return this.Embed.error('No media found in Tweet!');
            
        return this.Embed.ok(media);
    }
}