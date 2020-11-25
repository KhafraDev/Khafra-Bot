import { Command } from "../../Structures/Command.js";
import { Message, MessageReaction, User, MessageEmbed } from "discord.js";
import { YouTubeSearchResults, YouTubeError } from "../../lib/Backend/YouTube/types/YouTube";
import { YouTube } from "../../lib/Backend/YouTube/YouTube.js";
import { formatDate } from "../../lib/Utility/Date.js";

function* format(items: YouTubeSearchResults, embed: (reason?: string) => MessageEmbed) {
    for(let i = 0; i < items.items.length; i++) {
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

export default class extends Command {
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
        let results: YouTubeSearchResults | YouTubeError;
        try {
            results = await YouTube(args);
        } catch(e) {
            return message.reply(this.Embed.fail(`
            An unexpected error occurred!
            \`\`${e.toString()}\`\`
            `));
        }

        if('error' in results) {
            return message.reply(this.Embed.fail(`
            ${results.error.code}: ${results.error.message}
            `));
        } else if(results.pageInfo.totalResults === 0 || results.items.length === 0) {
            return message.reply(this.Embed.fail(`
            No results found!
            `));
        }

        const embeds = [...format(results, this.Embed.success)];
        let idx = 0;
        const m = await message.reply(embeds[0]);
        if(!m) {
            return;
        }
        await m.react('▶️');
        await m.react('◀️');
        await m.react('⏹️');

        const filter = (reaction: MessageReaction, user: User) => 
            user.id === message.author.id && ['▶️', '◀️', '⏹️'].indexOf(reaction.emoji.name) > -1;
        const collector = m.createReactionCollector(filter, { time: 60000 });

        collector.on('collect', async r => {
            if(m.deleted) {
                collector.stop();
                return;
            }

            if(r.emoji.name === '⏹️') {
                try {
                    await m.reactions.removeAll();
                } finally {
                    collector.stop();
                }
            } else if(r.emoji.name === '▶️') {
                if(embeds[idx + 1]) {
                    idx++;
                    return m.edit(embeds[idx]);
                }
            } else {
                if(embeds[idx - 1]) {
                    idx--;
                    return m.edit(embeds[idx]);
                }
            }
        });
    }
}