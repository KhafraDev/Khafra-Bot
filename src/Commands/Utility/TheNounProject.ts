import { Command, Arguments } from '../../Structures/Command.js';
import { Interaction, Message, MessageActionRow } from 'discord.js';
import { theNounProjectSearch } from '../../lib/Packages/TheNounProject/TheNounProject.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { Components } from '../../lib/Utility/Constants/Components.js';

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

        let page = 0;
        
        const row = new MessageActionRow()
			.addComponents(
                Components.approve('Next'),
                Components.secondary('Previous'),
                Components.deny('Stop')
            );

        const m = await message.channel.send({ 
            embeds: [this.Embed.success().setImage(icons.icons[page].preview_url)],
            components: [row]
        });

        const filter = (interaction: Interaction) =>
            interaction.isMessageComponent() &&
            ['approve', 'deny', 'secondary'].includes(interaction.customID) && 
            interaction.user.id === message.author.id;

        const collector = m.createMessageComponentCollector({ filter, time: 60000, max: 5 });
        collector.on('collect', i => {
            if (m.deleted) 
                return collector.stop();
            else if (i.customID === 'deny')
                return collector.stop('deny');

            i.customID === 'approve' ? page++ : page--;

            if (page < 0) page = icons.icons.length - 1;
            if (page >= icons.icons.length) page = 0;

            return void i.update({ embeds: [this.Embed.success().setImage(icons.icons[page].preview_url)] });
        });
        collector.on('end', (_c, reason) => {
            if (reason === 'deny' || reason === 'time' || reason === 'limit') 
                return void m.edit({ components: [] });
        });
    }
}
