import { Command } from "../../Structures/Command";
import { getCurrency, setCryptoInterval } from "../../lib/Backend/CoinGecko";
import { Message } from "discord.js";
import { formatDate } from "../../lib/Utility/Date";

setCryptoInterval(60 * 1000 * 5); // 5 minutes

export default class extends Command {
    constructor() {
        super(
            [
                'Get information about different CryptoCurrencies!',
                'btc', 'bitcoin', 'BAT'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'crypto',
                folder: 'Utility',
                args: [1],
                aliases: [ 'cc' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const currency = getCurrency(args.join(' '));
        if(!currency) {
            return message.channel.send(this.Embed.fail('No crypto found!'));
        }

        const embed = this.Embed.success()
            .setThumbnail(currency.image)
            .setTitle(`${currency.name} (${currency.symbol.toUpperCase()})`)
            .setTimestamp(currency.last_updated)
            .addFields(
                { name: '**Current Price:**', value: currency.current_price, inline: true },
                { name: '**High 24H:**',      value: currency.high_24h, inline: true },
                { name: '**Low 24H:**',       value: currency.low_24h, inline: true },

                { name: '**Market Cap:**',    value: currency.market_cap.toLocaleString(), inline: true },
                { name: '**Total Volume:**',  value: currency.total_volume.toLocaleString(), inline: true },
                { name: '**Circulating:**',   value: currency.circulating_supply.toLocaleString(), inline: true },

                { name: '**All Time High:**', value: currency.ath, inline: true },
                { name: '**% Change ATH:**',  value: currency.ath_change_percentage + '%', inline: true },
                { name: '**ATH Date:**',      value: formatDate('MMM. Do, YYYY', currency.ath_date), inline: true },

                { name: '**All Time Low:**',  value: currency.atl, inline: true },
                { name: '**% Change ATL:**',  value: currency.atl_change_percentage + '%', inline: true },
                { name: '**ATL Date:**',      value: formatDate('MMM. Do, YYYY', currency.atl_date), inline: true },

                { name: '**Change 24H:**',    value: '$' + currency.price_change_24h, inline: true },
                { name: '**% Change 24H:**',  value: currency.price_change_percentage_24h + '%', inline: true }
            );

        return message.channel.send(embed);
    }
}