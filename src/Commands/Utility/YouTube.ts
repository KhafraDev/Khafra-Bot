import { Command } from "../../Structures/Command";
import { Message, MessageReaction, User } from "discord.js";
import Embed from "../../Structures/Embed";
import { YouTubeSearchResults, YouTubeError } from "../../lib/Backend/YouTube/types/YouTube";
import { YouTube } from "../../lib/Backend/YouTube/YouTube";
import { formatDate } from "../../lib/Utility/Date";

function* format(items: YouTubeSearchResults) {
    for(let i = 0; i < items.items.length; i++) {
        const video = items.items[i].snippet;
        const embed = Embed.success()
            .setTitle(video.title)
            .setAuthor(video.channelTitle)
            .setThumbnail(video.thumbnails.default.url)
            .setDescription(`${video.description.slice(0, 2048)}`)
            .addField('**Published:**', formatDate('MMMM Do, YYYY hh:mm:ss A t', new Date(video.publishTime)))
            .addField('**URL:**', `https://youtube.com/watch?v=${items.items[i].id.videoId}`);
            
        yield embed;
    }
}

export default class extends Command {
    constructor() {
        super(
            [
                'Search for YouTube videos!',
                'Epic Minecraft Challenge (2012)'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'youtube',
                folder: 'Utility',
                args: [1],
                aliases: [ 'yt' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length === 0) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        let results: YouTubeSearchResults | YouTubeError;
        try {
            results = await YouTube(args);
        } catch(e) {
            return message.channel.send(Embed.fail(`
            An unexpected error occurred!
            \`\`${e.toString()}\`\`
            `));
        }

        if('error' in results) {
            return message.channel.send(Embed.fail(`
            ${results.error.code}: ${results.error.message}
            `));
        } else if(results.pageInfo.totalResults === 0 || results.items.length === 0) {
            return message.channel.send(Embed.fail(`
            No results found!
            `));
        }

        const embeds = [...format(results)];
        let idx = 0;
        const m = await message.channel.send(embeds[0]);

        try {
            await m.react('▶️');
            await m.react('◀️');
            await m.react('⏹️');
        } catch {}

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