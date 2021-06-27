import { Command, Arguments } from '../../Structures/Command.js';
import { Message, MessageActionRow, Interaction } from 'discord.js';
import { YouTube, YouTubeSearchResults } from '../../lib/Packages/YouTube.js';
import { formatDate } from '../../lib/Utility/Date.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { Components } from '../../lib/Utility/Constants/Components.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';

function* format(items: YouTubeSearchResults, embed = Embed.success) {
    for (let i = 0; i < items.items.length; i++) {
        const video = items.items[i].snippet;
        const Embed = embed()
            .setTitle(video.title)
            .setAuthor(video.channelTitle)
            .setThumbnail(video.thumbnails.default.url)
            .setDescription(`${video.description.slice(0, 2048)}`)
            .addField('**Published:**', formatDate('MMMM Do, YYYY hh:mm:ss A t', new Date(video.publishTime)))
            .addField('**URL:**', `https://youtube.com/watch?v=${items.items[i].id.videoId}`);
            
        yield Embed;
    }
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Search for YouTube videos!',
                'Epic Minecraft Challenge (2012)'
            ],
			{
                name: 'youtube',
                folder: 'Utility',
                args: [1],
                aliases: [ 'yt' ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const results = await YouTube(args);

        if ('error' in results) {
            return this.Embed.fail(`
            ${results.error.code}: ${results.error.message}
            `);
        } else if (results.pageInfo.totalResults === 0 || results.items.length === 0) {
            return this.Embed.fail(`
            No results found!
            `);
        }
        
        const embeds = [...format(results)];
        let page = 0;
        
        const row = new MessageActionRow()
			.addComponents(
                Components.approve('Next'),
                Components.secondary('Previous'),
                Components.deny('Stop')
            );

        const m = await message.channel.send({ 
            embeds: [embeds[0]],
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

            if (page < 0) page = embeds.length - 1;
            if (page >= embeds.length) page = 0;

            return void i.update({ embeds: [embeds[page]] });
        });
        collector.on('end', (_c, reason) => {
            if (reason === 'deny' || reason === 'time' || reason === 'limit') 
                return void m.edit({ components: [] });
        });
    }
}