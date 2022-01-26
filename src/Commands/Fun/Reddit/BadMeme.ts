import { Arguments, Command } from '#khaf/Command';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { isDM, isText } from '#khaf/utility/Discord.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { badmeme, cache } from '@khaf/badmeme';
import { ActionRow } from '@khaf/builders';
import { Interaction, Message } from 'discord.js';

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a bad meme!',
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
        const subreddit = typeof args[0] === 'string' ? args[0].toLowerCase() : 'dankmemes';
        if (!cache.has(subreddit)) {
            void message.channel.sendTyping();
        }
        
        const res = await badmeme(
            args[0], 
            isDM(message.channel) || (isText(message.channel) && message.channel.nsfw)
        );
        
        if (res === null) {
            return this.Embed.error(`
            No posts in this subreddit were found! If the subreddit is NSFW, make sure the channel is too!
            `);
        } else if ('error' in res) {
            if (res.error === 404) {
                return `❌ That subreddit doesn't exist!`;
            }

            switch (res.reason) {
                case 'banned': return this.Embed.error('Subreddit is banned!');
                case 'private': return this.Embed.error('Subreddit is set as private!');
                case 'quarantined': return this.Embed.error('Subreddit is quarantined!');
                default: return this.Embed.error(`Subreddit is blocked for reason "${res.reason}"!`)
            }
        } else if (res.url.length === 0) {
            return this.Embed.error(`
            No image posts found in this subreddit.
            
            If the channel isn't set to NSFW, adult subreddits won't work!
            `);
        }

        if (!Array.isArray(res.url))
            return res.url;

        let page = 0;
        
        const row = new ActionRow().addComponents(
            Components.approve('Next'),
            Components.secondary('Previous'),
            Components.deny('Stop')
        );

        const m = await message.channel.send({ 
            content: res.url[page],
            components: [row]
        });

        const filter = (interaction: Interaction) =>
            interaction.isMessageComponent() &&
            ['approve', 'deny', 'secondary'].includes(interaction.customId) && 
            interaction.user.id === message.author.id;

        const collector = m.createMessageComponentCollector({ filter, time: 60000, max: 5 });
        collector.on('collect', i => {
            if (i.customId === 'deny')
                return collector.stop('deny');

            i.customId === 'approve' ? page++ : page--;

            if (page < 0) page = res.url.length - 1;
            if (page >= res.url.length) page = 0;

            return void dontThrow(i.update({ content: res.url[page] }))
                .then(([e]) => e !== null && collector.stop());
        });
        collector.once('end', (c, r) => {
            if (r === 'deny') {
                return void dontThrow(c.last()!.update({ components: disableAll(m) }));
            }

            return void dontThrow(m.edit({ components: disableAll(m) }));
        });
    }
}