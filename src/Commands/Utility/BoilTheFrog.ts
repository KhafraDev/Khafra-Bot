import { Message, MessageReaction, User, MessageEmbed } from 'discord.js';
import { Command } from '../../Structures/Command.js';
import { boilTheFrog, BoiledArtist, Boiled } from '../../lib/Backend/BoilTheFrog.js';
import { promisify } from 'util';
import { randomInt } from 'crypto';

const rand: (a: number, b?: number) => Promise<number> = promisify(randomInt);
const randomSong = async (artist: BoiledArtist, Embed: MessageEmbed) => {
    const album = artist.tracks[await rand(artist.tracks.length)];

    return Embed
        .setDescription(`
        Try *${album.name}* by ${artist.name}!
        ${album.audio}
        `)
        .setImage(album.image);
}

export default class extends Command {
    constructor() {
        super(
            [ 
                '"Create a (nearly) seamless playlist between (almost) any two artists". Separate band names with a "-"!',
                'The Beatles - Green Day'
            ],
			{
                name: 'boilthefrog',
                folder: 'Fun',
                aliases: [ 'combine', 'combineartists' ],
                args: [2]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const [a, ...b] = args.join(' ').split('-');
        if(b.length === 0) {
            return message.reply(this.Embed.generic('Must provide two different artists!'));
        }

        let seams: Boiled | null = null;
        try {
            seams = await boilTheFrog(a.trim(), b.join(' ').trim());
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server failed to process the request!'));
            } else if(e.name === 'BoiledError') {
                return message.reply(this.Embed.fail(e.toString()));
            }

            return message.reply(this.Embed.fail(`An unknown ${e.name} occurred!`));
        }

        const m = await message.reply(await randomSong(seams.path.shift(), this.Embed.success()));
        if(!m) return;
        // allSettled won't throw if there's an error
        await Promise.allSettled(['➡️', '🗑️'].map(e => m.react(e)));

        const collector = m.createReactionCollector(
            (r: MessageReaction, u: User) => u.id === message.author.id && ['➡️', '🗑️'].includes(r.emoji.name),
            { time: 120000, max: seams.path.length }
        );
        collector.on('collect', async r => {
            if(r.emoji.name === '➡️') {
                console.log(seams.path);
                if(seams.path.length > 0) {
                    const e = await randomSong(seams.path.shift(), this.Embed.success());
                    return m.edit(e);
                }
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