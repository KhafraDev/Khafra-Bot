import { Command, Arguments } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { getTwitterMediaURL } from '../../lib/Packages/Twitter.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { URLFactory } from '../../lib/Utility/Valid/URL.js';

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

    async init(_message: Message, { args }: Arguments) {
        const { hostname, pathname } = URLFactory(args[0]) ?? {};
        if (hostname !== 'twitter.com')
            return this.Embed.fail('Not a Twitter status!');
        if (!/\/[A-z0-9]+\/status\/\d{17,19}$/.test(pathname))
            return this.Embed.fail(`Invalid Twitter status!`);

        const id = pathname.match(/\/(\d+)$/)[1];
        const media = await getTwitterMediaURL(id);

        if (!media)
            return this.Embed.fail('No media found in Tweet!');
            
        return this.Embed.success(media);
    }
}