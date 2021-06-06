import { Command, Arguments } from '../../../Structures/Command.js';
import { Message, MessageEmbed, MessageReaction, Permissions, User } from 'discord.js';
import { rand } from '../../../lib/Utility/Constants/OneLiners.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import Trump from '../../../../assets/Trump.json';
import { RegisterCommand } from '../../../Structures/Decorator.js';

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
                args: [0, 3] // 0 = random, 3 = February 10, 2017
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const item = args.length === 0 
            ? [Trump[await rand(Trump.length)]]
            : Trump.filter(({ date }) => date.toLowerCase() === args.join(' ').toLowerCase());      
            
        if (!item || item.length === 0) {
            return this.Embed.fail('Wow! No atrocities on that day.');
        } else if (item.length === 1 || !hasPerms(message.channel, message.guild.me, Permissions.FLAGS.MANAGE_MESSAGES)) {
            const { text, color, emojis } = item.shift();
            return new MessageEmbed()
                .setColor(color)
                .setDescription(`${emojis.join('')} ${text}`);
        }

        const embeds = item.map(atro => new MessageEmbed()
            .setColor(atro.color)
            .setDescription(`${atro.emojis.join('')} ${atro.text}`)
        );

        let page = 0;

        const m = await message.reply({ embed: embeds[page] });
        await m.react('▶️');
        await m.react('◀️');
        await m.react('🗑️');
        
        const filter = (r: MessageReaction, u: User) => 
            ['▶️', '◀️', '🗑️'].includes(r.emoji.name) && 
            u.id === message.author.id;

        const collector = m.createReactionCollector(filter, { max: item.length * 2, time: 60000 });
        collector.on('collect', async reaction => {
            if (m.deleted) return collector.stop();

            if (reaction.emoji.name === '🗑️')
                return collector.stop();

            const old = page;
            reaction.emoji.name === '▶️' ? page++ : page--;

            if (page < 0) page = 0;
            if (page >= embeds.length) page = embeds.length - 1;

            if (page !== old)
                return m.edit(embeds[page]);
        });
        collector.on('end', () => m.reactions.removeAll());
    }
}