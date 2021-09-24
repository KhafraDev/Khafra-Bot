import { Command, Arguments } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { Interaction, Message, MessageActionRow, MessageEmbed } from 'discord.js';
import { rand } from '../../../lib/Utility/Constants/OneLiners.js';
import { Components } from '../../../lib/Utility/Constants/Components.js';
import { createFileWatcher } from '../../../lib/Utility/FileWatcher.js';
import { cwd } from '../../../lib/Utility/Constants/Path.js';
import { join } from 'path';
import { Paginate } from '../../../lib/Utility/Discord/Paginate.js';

const Trump = createFileWatcher([] as typeof import('../../../../assets/JSON/Trump.json'), join(cwd, 'assets/JSON/Trump.json'));

@RegisterCommand
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
            return this.Embed.fail('Wow! No atrocities on that day.');
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