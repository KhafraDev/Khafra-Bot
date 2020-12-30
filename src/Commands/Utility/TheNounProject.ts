import { Command } from '../../Structures/Command.js';
import { Message, MessageReaction, User } from 'discord.js';
import { theNounProjectSearch } from '../../lib/Backend/TheNounProject/TheNounProject.js';
import { NounSearch } from '../../lib/Backend/TheNounProject/types/Noun.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Search for free icons from TheNounProject.',
                'global warming'
            ],
			{
                name: 'thenounproject',
                folder: 'Utility',
                args: [1],
                aliases: [ 'tnp' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        let icons: NounSearch | null;
        try {
            icons = await theNounProjectSearch(args.join(' '));
        } catch(e) {
            if(e.name === 'AssertionError') {
                return message.reply(this.Embed.fail('Received bad response from server.'));
            }

            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        if(icons.icons.length === 0) {
            return message.reply(this.Embed.fail('No icons found for that search!'));
        }

        let i = 0;
        const format = () => {
            if(!icons.icons[i]) {
                this.Embed.success().setImage(icons.icons[0].preview_url)
            }
            return this.Embed.success().setImage(icons.icons[i].preview_url);
        }
        const m = await message.reply(format());
        if(!m) return;

        await m.react('▶️');
        await m.react('◀️');

        const collector = m.createReactionCollector(
            (r: MessageReaction, u: User) => ['▶️', '◀️'].includes(r.emoji.name) && u.id === message.author.id,
            { max: 10, time: 60000 } 
        );
        collector.on('collect', r => {
            r.emoji.name === '▶️' ? i++ : i--;
            try {
                return m.edit(format());
            } catch {}
        });
        collector.on('end', () => {
            try {
                return m.reactions.removeAll();
            } catch {}
        });
    }
}
