import { Message } from 'discord.js';
import { Command, Arguments } from '../../Structures/Command.js';
import { kbgSetInterval, cache } from '../../lib/Backend/KillledByGoogle.js';
import { rand } from '../../lib/Utility/Constants/OneLiners.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
    middleware = [ kbgSetInterval ];
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
        if (typeof cache.total !== 'number') {
            return this.Embed.fail('An error occurred caching the data.');
        } 

        const prods = cache.ageSorted;
        let product;
        if (args.length === 0) {
            product = prods[await rand(prods.length)];
        } else if (args.length > 1) {
            product = prods.find(p => p.name.toLowerCase() === args.join(' ').toLowerCase());
            if (!product) {
                return this.Embed.fail('No product with that name was killed by Google.');
            }
        } else {
            const type = args[0].toLowerCase();
            if (cache.categories.includes(type)) {
                const all = prods.filter(t => t.type === type);
                product = all[await rand(all.length)];
            } else if (type === 'oldest') {
                product = prods[prods.length - 1];
            } else if (type === 'newest') {
                product = prods[0];
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(type)) {
                const date = type.match(/^\d{4}-\d{2}-\d{2}$/)[0];
                product = prods.find(t => t.dateClose === date);
                if (!product) 
                    return this.Embed.fail('No products were killed by Google on that date!');
            } else {
                return this.Embed.generic(this);
            }
        }

        return this.Embed.success(`
        [${product.name}](${product.link})
        ${product.dateOpen} to ${product.dateClose}

        \`\`${product.description}\`\`
        `);
    }
}