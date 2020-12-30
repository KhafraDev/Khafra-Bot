import { Message, MessageReaction, User, Permissions } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { px, FHPX } from '../../lib/Backend/500px.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Search 500px for photos.',
                'chihuahua', 'television'
            ],
			{
                name: '500px',
                folder: 'Utility',
                args: [1],
                permissions: [ Permissions.FLAGS.ADD_REACTIONS ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        let pics: FHPX | null = null;
        try {
            pics = await px(args.join(' '), 'nsfw' in message.channel ? message.channel.nsfw : true);
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('A server-side issue occurred!'));
            } else if(e.name === 'AssertionError') {
                return message.reply(this.Embed.fail('No images found!'));
            }

            return message.reply(this.Embed.fail(`An unknown ${e.name} occurred!`));
        }

        let page = 0;
        const m = await message.reply(this.Embed.success(`https://500px${pics.photos[page].url}`).setImage(pics.photos[page].image_url[0]));
        if(!m) return;
        // allSettled won't throw if there's an error
        await Promise.allSettled(['➡️', '⬅️', '🗑️'].map(e => m.react(e)));

        const collector = m.createReactionCollector(
            (r: MessageReaction, u: User) => u.id === message.author.id && ['➡️', '⬅️', '🗑️'].includes(r.emoji.name),
            { time: 120000, max: 15 }
        );
        collector.on('collect', r => {
            if(r.emoji.name === '➡️') {
                if(!pics.photos[++page]) return;
                return m.edit(this.Embed.success(`https://500px${pics.photos[page].url}`).setImage(pics.photos[page].image_url[0]));
            } else if(r.emoji.name === '⬅️') {
                if(!pics.photos[--page]) return;
                return m.edit(this.Embed.success(`https://500px${pics.photos[page].url}`).setImage(pics.photos[page].image_url[0]));
            } 

            return collector.stop();
        });
        collector.on('end', () => {
            try {
                return m.reactions.removeAll();
            } catch {}
        });
    }
}