import { Command, Arguments } from '../../Structures/Command.js';
import { Interaction, Message, MessageActionRow } from 'discord.js';
import { badmeme } from '@khaf/badmeme';
import { isDM, isText } from '../../lib/types/Discord.js.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { Components } from '../../lib/Utility/Constants/Components.js';

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
        
        if (res === null)
            return this.Embed.fail(`No posts in this subreddit were found, sorry!`);
        else if ('error' in res) {
            if (res.reason === 'private')
                return this.Embed.fail('Subreddit is set as private!');
            else if (res.reason === 'banned') // r/the_donald
                return this.Embed.fail('Subreddit is banned!');
            else if (res.reason === 'quarantined') // r/spacedicks (all others are just banned now)
                return this.Embed.fail('Subreddit is quarantined!');
                
            return this.Embed.fail(`Subreddit is blocked for reason "${res.reason}"!`);
        } else if (res.url.length === 0)
            return this.Embed.fail(`
            No image posts found in this subreddit.
            
            If the channel isn't set to NSFW, adult subreddits won't work!
            `);

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
            ['approve', 'deny', 'secondary'].includes(interaction.customID) && 
            interaction.user.id === message.author.id;

        const collector = m.createMessageComponentInteractionCollector({ filter, time: 60000, max: 5 });
        collector.on('collect', i => {
            if (m.deleted) 
                return collector.stop();
            else if (i.customID === 'deny')
                return collector.stop('deny');

            i.customID === 'approve' ? page++ : page--;

            if (page < 0) page = res.url.length - 1;
            if (page >= res.url.length) page = 0;

            return void i.update({ content: res.url[page] });
        });
        collector.on('end', (_c, reason) => {
            if (reason === 'deny' || reason === 'time' || reason === 'limit') 
                return void m.edit({ components: [] });
        });
    }
}