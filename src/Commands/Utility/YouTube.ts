import { Command, Arguments } from '../../Structures/Command.js';
import { Message, MessageActionRow, Interaction } from 'discord.js';
import { YouTube, YouTubeSearchResults } from '../../lib/Packages/YouTube.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { Components } from '../../lib/Utility/Constants/Components.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { assets } from '../../lib/Utility/Constants/Path.js';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { time } from '@discordjs/builders';
import { Paginate } from '../../lib/Utility/Discord/Paginate.js';
import { decodeXML } from 'entities';

// after 90 days of inactivity, Google deactives the key.
// to prevent this, once a day the bot will use the api
setInterval(async () => {
    const file = await readFile(join(assets, 'Hangman/countries.txt'), 'utf-8');
    const lines = file
        .split(/\n\r|\n|\r/g)
        .filter(l => !l.startsWith('#') && l.length > 0);
    const search = lines[Math.floor(Math.random() * lines.length)];

    await dontThrow(YouTube([search]));
}, 1000 * 60 * 60 * 24);

function* format(items: YouTubeSearchResults, embed = Embed.success) {
    for (let i = 0; i < items.items.length; i++) {
        const video = items.items[i].snippet;
        const Embed = embed()
            .setTitle(decodeXML(video.title))
            .setAuthor(video.channelTitle)
            .setThumbnail(video.thumbnails.default.url)
            .setDescription(`${video.description.slice(0, 2048)}`)
            .addField('**Published:**', time(new Date(video.publishTime)))
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
        const row = new MessageActionRow().addComponents(
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
            ['approve', 'deny', 'secondary'].includes(interaction.customId) && 
            interaction.user.id === message.author.id;

        const c = m.createMessageComponentCollector({ filter, time: 60000, max: 5 });
        return Paginate(c, m, embeds.length, embeds);
    }
}