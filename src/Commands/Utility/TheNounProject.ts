import { Command, Arguments } from '../../Structures/Command.js';
import { Message, MessageReaction, User } from 'discord.js';
import { theNounProjectSearch } from '../../lib/Packages/TheNounProject/TheNounProject.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
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
                aliases: [ 'tnp' ],
                errors: {
                    AssertionError: 'Received bad response from server.'
                }
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const icons = await theNounProjectSearch(args.join(' '));
        
        if (icons.icons.length === 0) {
            return this.Embed.fail('No icons found for that search!');
        }

        let i = 0;
        const format = () => !icons.icons[i] 
            ? this.Embed.success().setImage(icons.icons[0].preview_url)
            : this.Embed.success().setImage(icons.icons[i].preview_url);
        
        const m = await message.reply({ embed: format() });

        await m.react('▶️');
        await m.react('◀️');

        const collector = m.createReactionCollector(
            (r: MessageReaction, u: User) => ['▶️', '◀️'].includes(r.emoji.name) && u.id === message.author.id,
            { max: 10, time: 60000 } 
        );
        collector.on('collect', r => {
            r.emoji.name === '▶️' ? i++ : i--;
            return m.edit(format());
        });
        collector.on('end', () => m.reactions.removeAll());
    }
}
