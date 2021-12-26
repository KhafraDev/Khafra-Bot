import { Command, Arguments } from '#khaf/Command';
import { Interaction, Message, MessageActionRow } from 'discord.js';
import { theNounProjectSearch } from '../../lib/Packages/TheNounProject/TheNounProject.js';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Paginate } from '#khaf/utility/Discord/Paginate.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';

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

    async init(message: Message, { content }: Arguments) {
        const [err, icons] = await dontThrow(theNounProjectSearch(content));
        
        if (err !== null || icons === null || icons.icons.length === 0) {
            return this.Embed.error('No icons found for that search!');
        }
        
        const row = new MessageActionRow().addComponents(
            Components.approve('Next'),
            Components.secondary('Previous'),
            Components.deny('Stop')
        );

        const m = await message.channel.send({ 
            embeds: [this.Embed.ok().setImage(icons.icons[0].preview_url)],
            components: [row]
        });

        const filter = (interaction: Interaction) =>
            interaction.isMessageComponent() &&
            ['approve', 'deny', 'secondary'].includes(interaction.customId) && 
            interaction.user.id === message.author.id;

        const c = m.createMessageComponentCollector({ filter, time: 60000, max: 5 });
        const fn = (page: number) => this.Embed.ok().setImage(icons.icons[page].preview_url);

        return Paginate(c, m, 5 * 2, fn);
    }
}
