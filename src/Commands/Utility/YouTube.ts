import { Command } from '../../Structures/Command.js';
import { Message, MessageReaction, User, MessageEmbed } from 'discord.js';
import { YouTube, YouTubeSearchResults } from '../../lib/Backend/YouTube.js';
import { formatDate } from '../../lib/Utility/Date.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

function* format(items: YouTubeSearchResults, embed: (reason?: string) => MessageEmbed) {
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

    async init(message: Message, args: string[]) {
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

        const embeds = [...format(results, this.Embed.success)];
        let idx = 0;
        const m = await message.reply(embeds[0]);
        
        await m.react('▶️');
        await m.react('◀️');
        await m.react('⏹️');

        const filter = (reaction: MessageReaction, user: User) => 
            user.id === message.author.id && ['▶️', '◀️', '⏹️'].indexOf(reaction.emoji.name) > -1;
        const collector = m.createReactionCollector(filter, { time: 60000 });

        collector.on('collect', async r => {
            if (m.deleted) {
                collector.stop();
                return;
            }

            if (r.emoji.name === '⏹️') {
                await m.reactions.removeAll();
            } else if (r.emoji.name === '▶️') {
                if (embeds[idx + 1]) {
                    idx++;
                    return m.edit(embeds[idx]);
                }
            } else {
                if (embeds[idx - 1]) {
                    idx--;
                    return m.edit(embeds[idx]);
                }
            }
        });
    }
}