import { Command, Arguments } from '../../Structures/Command.js';
import { Message, MessageReaction, User } from 'discord.js';
import { badmeme, IBadMemeCache } from '../../lib/Backend/BadMeme/BadMeme.js';
import { isDM } from '../../lib/types/Discord.js.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

function* makeGenerator(arr: IBadMemeCache) {
    for (const item of arr.url)
        yield item;
}

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

    async init(message: Message, { args }: Arguments) {        
        const res = await badmeme(args[0], isDM(message.channel) || message.channel.nsfw);
        if ('error' in res) {
            if (res.reason === 'private')
                return this.Embed.fail('Subreddit is set as private!');
            else if (res.reason === 'banned') // r/the_donald
                return this.Embed.fail('Subreddit is banned!');
            else if (res.reason === 'quarantined') // r/spacedicks (all others are just banned now)
                return this.Embed.fail('Subreddit is quarantined!');
                
            return this.Embed.fail(`Subreddit is blocked for reason "${res.reason}"!`);
        }

        if (!res || res.url.length === 0)
            return this.Embed.fail(`
            No image posts found in this subreddit.
            
            If the channel isn't set to NSFW, adult subreddits won't work!
            `);

        if (!Array.isArray(res.url))
            return res.url;

        let lastEdit = 0;

        const g = makeGenerator(res);
        const f = (r: MessageReaction, u: User) => 
            ['▶️', '🗑️'].includes(r.emoji.name) &&
            u.id === message.author.id;

        const m = await message.channel.send(g.next().value as string);
        await Promise.allSettled([m.react('▶️'), m.react('🗑️')]);
        const c = m.createReactionCollector(f, { max: 6, time: 30000 });

        c.on('collect', async (r: MessageReaction) => {
            if (r.emoji.name === '🗑️')
                return c.stop();

            if ((Date.now() - lastEdit) / 1000 < 5)
                return;

            const next = g.next();
            if (next.done === true || !next.value)
                return c.stop();

            lastEdit = Date.now();
            return m.edit(next.value);
        });

        c.on('end', () => m.reactions.removeAll());
    }
}