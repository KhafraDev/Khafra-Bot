import { Command, Arguments } from '../../Structures/Command.js';
import { setCryptoInterval, cache } from '../../lib/Packages/CoinGecko.js';
import { Message } from 'discord.js';
import { formatDate } from '../../lib/Utility/Date.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { once } from '../../lib/Utility/Memoize.js';

const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format;
const mw = once(setCryptoInterval);

@RegisterCommand
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

    async init(_message: Message, { args }: Arguments) {
        await mw();
        
        if (!cache.has(args.join(' ').toLowerCase()))
            return this.Embed.fail(`
            No cryptocurrency with that name or ID was found!

            The API used does not yet support this currency.
            `);

        const currency = cache.get(args.join(' ').toLowerCase());

        return this.Embed.success()
            .setThumbnail(currency.image)
            .setTitle(`${currency.name} (${currency.symbol.toUpperCase()})`)
            .setTimestamp(currency.last_updated)
            .addFields(
                { name: '**Current Price:**', value: f(currency.current_price), inline: true },
                { name: '**High 24H:**',      value: f(currency.high_24h), inline: true },
                { name: '**Low 24H:**',       value: f(currency.low_24h), inline: true },

                { name: '**Market Cap:**',    value: currency.market_cap.toLocaleString(), inline: true },
                { name: '**Total Volume:**',  value: currency.total_volume.toLocaleString(), inline: true },
                { name: '**Circulating:**',   value: currency.circulating_supply.toLocaleString(), inline: true },

                { name: '**All Time High:**', value: f(currency.ath), inline: true },
                { name: '**% Change ATH:**',  value: currency.ath_change_percentage.toFixed(2) + '%', inline: true },
                { name: '**ATH Date:**',      value: formatDate('MMM. Do, YYYY', currency.ath_date), inline: true },

                { name: '**All Time Low:**',  value: (currency.atl), inline: true },
                { name: '**% Change ATL:**',  value: currency.atl_change_percentage.toFixed(2) + '%', inline: true },
                { name: '**ATL Date:**',      value: formatDate('MMM. Do, YYYY', currency.atl_date), inline: true },

                { name: '**Change 24H:**',    value: f(currency.price_change_24h), inline: true },
                { name: '**% Change 24H:**',  value: currency.price_change_percentage_24h + '%', inline: true }
            );
    }
}
