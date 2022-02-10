import { Arguments, Command } from '#khaf/Command';
import { Components } from '#khaf/utility/Constants/Components.js';
import { assets } from '#khaf/utility/Constants/Path.js';
import { Paginate } from '#khaf/utility/Discord/Paginate.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { ActionRow, Embed } from '@khaf/builders';
import { Message, Util } from 'discord.js';
import { join } from 'path';

const Trump = createFileWatcher(
    [] as typeof import('../../../../assets/JSON/Trump.json'),
    join(assets, 'JSON/Trump.json')
);

export class kCommand extends Command {    
    constructor () {
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

    async init (message: Message, { args }: Arguments): Promise<Embed | void> {
        const item = args.length === 0 
            ? [Trump[Math.floor(Math.random() * Trump.length)]]
            : Trump.filter(({ date }) => date.toLowerCase() === args.join(' ').toLowerCase());      
            
        if (item.length === 0) {
            return this.Embed.error('Wow! No atrocities on that day.');
        } else if (item.length === 1) {
            const { text, color, emojis } = item.shift()!;
            return new Embed()
                .setColor(Util.resolveColor(color as `#${string}`))
                .setDescription(`${emojis.join('')} ${text}`);
        }

        const embeds = item.map(atro => new Embed()
            .setColor(Util.resolveColor(atro.color as `#${string}`))
            .setDescription(`${atro.emojis.join('')} ${atro.text}`)
        );

        const row = new ActionRow().addComponents(
            Components.approve('Next'),
            Components.secondary('Previous'),
            Components.deny('Stop')
        );

        const m = await message.reply({ 
            embeds: [embeds[0]],
            components: [row]
        });

        const c = m.createMessageComponentCollector({
            filter: (interaction) =>
                interaction.isMessageComponent() &&
                ['approve', 'deny', 'secondary'].includes(interaction.customId) && 
                interaction.user.id === message.author.id,
            time: 60000,
            max: item.length * 2
        });

        return Paginate(c, m, item.length * 2, embeds);
    }
}