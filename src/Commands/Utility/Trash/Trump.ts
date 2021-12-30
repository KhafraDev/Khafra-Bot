import { Command, Arguments } from '#khaf/Command';
import { Interaction, Message, MessageActionRow } from 'discord.js';
import { rand } from '#khaf/utility/Constants/OneLiners.js';
import { Components } from '#khaf/utility/Constants/Components.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { assets } from '#khaf/utility/Constants/Path.js';
import { join } from 'path';
import { Paginate } from '#khaf/utility/Discord/Paginate.js';
import { MessageEmbed } from '#khaf/Embed';

const Trump = createFileWatcher(
    [] as typeof import('../../../../assets/JSON/Trump.json'),
    join(assets, 'JSON/Trump.json')
);

export class kCommand extends Command {    
    constructor() {
        super(
            [
                'Get atrocities committed by Trump on a given day (or a random day)!',
                'October 12, 2020',
            ],
			{
                name: 'trump',
                folder: 'Trash',
                args: [0, 3] // 0 = random, 3, ie = February 10, 2017
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const item = args.length === 0 
            ? [Trump[await rand(Trump.length)]]
            : Trump.filter(({ date }) => date.toLowerCase() === args.join(' ').toLowerCase());      
            
        if (!item || item.length === 0) {
            return this.Embed.error('Wow! No atrocities on that day.');
        } else if (item.length === 1) {
            const { text, color, emojis } = item.shift()!;
            return new MessageEmbed()
                .setColor(color as `#${string}`)
                .setDescription(`${emojis.join('')} ${text}`);
        }

        const embeds = item.map(atro => new MessageEmbed()
            .setColor(atro.color as `#${string}`)
            .setDescription(`${atro.emojis.join('')} ${atro.text}`)
        );

        const row = new MessageActionRow()
			.addComponents(
                Components.approve('Next'),
                Components.secondary('Previous'),
                Components.deny('Stop')
            );

        const m = await message.reply({ 
            embeds: [embeds[0]],
            components: [row]
        });

        const filter = (interaction: Interaction) =>
            interaction.isMessageComponent() &&
            ['approve', 'deny', 'secondary'].includes(interaction.customId) && 
            interaction.user.id === message.author.id;

        const c = m.createMessageComponentCollector({ filter, time: 60000, max: item.length * 2 });
        return Paginate(c, m, item.length * 2, embeds);
    }
}