import { Command, Arguments } from '../../Structures/Command.js';
import { CoinGecko } from '../../lib/Packages/CoinGecko.js';
import { Message, ReplyMessageOptions } from 'discord.js';
import { stripIndents } from '../../lib/Utility/Template.js';
import { bold, inlineCode, time } from '@khaf/builders';

const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format;

export class kCommand extends Command {
    constructor() {
        super(
            [
                'Get information about different CryptoCurrencies!',
                'btc', 'bitcoin', 'BAT'
            ],
			{
                name: 'crypto',
                folder: 'Utility',
                args: [1], // some symbols are multi-worded
                aliases: [ 'cc' ]
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const currencies = await CoinGecko.get(args.join(' '), () => {
            void message.channel.sendTyping();
        });

        if (currencies === undefined) {
            return this.Embed.fail(`No currency with that name or id could be found!`);
        }
        
        const currency = Array.isArray(currencies) ? currencies[0] : currencies;

        const embed = this.Embed.success()
            .setThumbnail(currency.image)
            .setTitle(`${currency.name} (${currency.symbol.toUpperCase()})`)
            .setTimestamp(currency.last_updated)
            .addFields(
                { name: bold('Current Price:'), value: f(currency.current_price), inline: true },
                { name: bold('High 24H:'),      value: f(currency.high_24h), inline: true },
                { name: bold('Low 24H:'),       value: f(currency.low_24h), inline: true },

                { name: bold('Market Cap:'),    value: currency.market_cap.toLocaleString(), inline: true },
                { name: bold('Total Volume:'),  value: currency.total_volume.toLocaleString(), inline: true },
                { name: bold('Circulating:'),   value: currency.circulating_supply.toLocaleString(), inline: true },

                { name: bold('All Time High:'), value: f(currency.ath), inline: true },
                { name: bold('% Change ATH:'),  value: `${currency.ath_change_percentage.toFixed(2)}%`, inline: true },
                { name: bold('ATH Date:'),      value: time(new Date(currency.ath_date), 'D'), inline: true },

                { name: bold('All Time Low:'),  value: f(currency.atl), inline: true },
                { name: bold('% Change ATL:'),  value: `${currency.atl_change_percentage.toFixed(2)}%`, inline: true },
                { name: bold('ATL Date:'),      value: time(new Date(currency.atl_date), 'D'), inline: true },

                { name: bold('Change 24H:'),    value: f(currency.price_change_24h), inline: true },
                { name: bold('% Change 24H:'),  value: `${currency.price_change_percentage_24h}%`, inline: true }
            );

        if (!Array.isArray(currencies))
            return embed;

        return {
            content: currencies.length === 1 ? null : stripIndents`
            There were ${currencies.length} cryptocurrencies with that search query provided.

            If this is the wrong currency, try using one of the following IDs:
            ${currencies.map(c => inlineCode(c.id)).join(', ')}
            `.trim(),
            embeds: [embed],
            failIfNotExists: false
        } as ReplyMessageOptions;
    }
}
