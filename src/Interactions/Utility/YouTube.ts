import { CommandInteraction, InteractionCollector, Message, MessageActionRow, MessageComponentInteraction } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { bold, time } from '@discordjs/builders';
import { YouTube, YouTubeSearchResults } from '../../lib/Packages/YouTube.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { Components, disableAll } from '../../lib/Utility/Constants/Components.js';
import { InteractionType } from 'discord-api-types';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

function* format(items: YouTubeSearchResults) {
    for (let i = 0; i < items.items.length; i++) {
        const video = items.items[i].snippet;
        const embed = Embed.success()
            .setTitle(video.title)
            .setAuthor(video.channelTitle)
            .setThumbnail(video.thumbnails.default.url)
            .setDescription(`${video.description.slice(0, 2048)}`)
            .addField(bold('Published:'), time(new Date(video.publishTime)))
            .addField(bold('URL:'), `https://youtube.com/watch?v=${items.items[i].id.videoId}`);
            
        yield embed;
    }
}

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'youtube',
            description: 'Gets YouTube videos matching your search.',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'search',
                    description: 'Videos to search for.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const query = interaction.options.getString('search', true);
        const results = await YouTube(query);

        if ('error' in results) {
            return `❌ ${results.error.code}: ${results.error.message}`;
        } else if (results.pageInfo.totalResults === 0 || results.items.length === 0) {
            return `❌ No results found!`;
        }
        
        const embeds = [...format(results)];
        let page = 0;

        const m = await interaction.editReply({ 
            embeds: [embeds[0]],
            components: [
                new MessageActionRow().addComponents(
                    Components.approve('Next'),
                    Components.secondary('Previous'),
                    Components.deny('Stop')
                )
            ]
        }) as Message;

        const c = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent as number,
            message: m,
            time: 120_000,
            idle: 60_000,
            filter: (i) =>
                i.user.id === interaction.user.id
        });

        c.on('collect', i => {
            if (i.customId === 'deny' || c.total >= embeds.length) {
                return c.stop();
            }

            i.customId === 'approve' ? page++ : page--;

            if (page < 0) page = embeds.length - 1;
            if (page >= embeds.length) page = 0;

            return void dontThrow(i.update({
                embeds: [embeds[page]]
            }));
        });

        c.on('end', (c) => {
            return void dontThrow(c.last()!.update({ components: disableAll(m) }))
        });
    }
} 