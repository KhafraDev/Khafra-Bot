import { Command, Arguments } from '../../../Structures/Command.js';
import { Interaction, Message, MessageActionRow } from 'discord.js';
import { badmeme } from '@khaf/badmeme';
import { isDM, isText } from '../../../lib/types/Discord.js.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';

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
        const res = await badmeme(
            args[0], 
            isDM(message.channel) || (isText(message.channel) && message.channel.nsfw)
        );
        
        if (res === null) {
            if (isText(message.channel) && message.channel.nsfw) {
                return this.Embed.fail(`This channel isn't marked as NSFW!`);
            }

            return this.Embed.fail(`No posts in this subreddit were found, sorry!`);
        } else if ('error' in res) {
            switch (res.reason) {
                case 'banned': return this.Embed.fail('Subreddit is banned!');
                case 'private': return this.Embed.fail('Subreddit is set as private!');
                case 'quarantined': return this.Embed.fail('Subreddit is quarantined!');
                default: return this.Embed.fail(`Subreddit is blocked for reason "${res.reason}"!`)
            }
        } else if (res.url.length === 0) {
            return this.Embed.fail(`
            No image posts found in this subreddit.
            
            If the channel isn't set to NSFW, adult subreddits won't work!
            `);
        }

        if (!Array.isArray(res.url))
            return res.url;

        let page = 0;
        
        const row = new MessageActionRow()
			.addComponents(
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
            if (m.deleted) 
                return collector.stop();
            else if (i.customId === 'deny')
                return collector.stop('deny');

            i.customId === 'approve' ? page++ : page--;

            if (page < 0) page = res.url.length - 1;
            if (page >= res.url.length) page = 0;

            return void dontThrow(i.update({ content: res.url[page] }));
        });
        collector.on('end', (c, r) => {
            if (r === 'deny') {
                return void dontThrow(c.last()!.update({ components: disableAll(m) }));
            }

            return void dontThrow(m.edit({ components: disableAll(m) }));
        });
    }
}