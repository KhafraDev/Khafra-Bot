import { Message } from 'discord.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { kbgSetInterval, cache, categories } from '../../lib/Packages/KillledByGoogle.js';
import { rand } from '../../lib/Utility/Constants/OneLiners.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';

type FromSet<T extends Set<unknown>> = T extends Set<infer U> ? U : never;

const embed = (product: FromSet<typeof cache>) => {
    if (!product)
        return Embed.fail('No product found!');

    return Embed.success(`
    [${product.name}](${product.link})
    ${product.dateOpen} to ${product.dateClose}

    \`\`${product.description}\`\`
    `);
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get a product killed by Google. Search by newest, oldest, date, category, or get a random one!',
                'service', 'Google Flu Vaccine Finder', 'newest', 'oldest', '2012-04-20'
            ],
			{
                name: 'killedbygoogle',
                folder: 'Fun',
                args: [0]
            }
        );
    }

    async init(_message: Message, { args }: Arguments) {
        await kbgSetInterval();
        
        if (cache.size === 0) {
            return this.Embed.fail('An error occurred caching the data.');
        } 

        const all = [...cache.values()];
        const type = args.join(' ').toLowerCase();

        if (args.length === 0) { // random product
            return embed(all[await rand(all.length)]);
        } else if (categories.has(type)) { // search by category
            const byCategory = all.filter(t => t.type === type);
            return embed(byCategory[await rand(byCategory.length)]);
        } else if (type === 'oldest') { // oldest killed
            return embed(all.pop());
        } else if (type === 'newest') { // newest killed
            return embed(all.shift());
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(type)) { // search by date
            const { date } = type.match(/^(?<date>\d{4}-\d{2}-\d{2})$/).groups;
            return embed(all.find(t => t.dateClose === date));
        } else if (all.some(i => i.name.toLowerCase() === type)) { // search by name
            return embed(all.find(i => i.name.toLowerCase() === type));
        }

        return this.Embed.generic(this); // no idea what you're trying to do
    }
}