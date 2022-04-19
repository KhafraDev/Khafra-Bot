import type { Arguments} from '#khaf/Command';
import { Command } from '#khaf/Command';
import { CoinGecko } from '#khaf/utility/commands/CoinGecko';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { stripIndents } from '#khaf/utility/Template.js';
import { time } from '@discordjs/builders';
import type { APIEmbed } from 'discord-api-types/v10';
import type { Message, ReplyMessageOptions } from 'discord.js';

const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format;

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Get information about different CryptoCurrencies! Kill the environment!',
                'btc', 'bitcoin', 'BAT'
            ],
            {
                name: 'crypto',
                folder: 'Utility',
                args: [1], // some symbols are multi-worded
                aliases: ['cc']
            }
        );
    }

    async init (message: Message, { args }: Arguments): Promise<ReplyMessageOptions | APIEmbed> {
        const currencies = await CoinGecko.get(args.join(' '), () => {
            void message.channel.sendTyping();
        });

        if (currencies === undefined || currencies.length === 0) {
            return Embed.error('No currency with that name or id could be found!');
        }

        const currency = Array.isArray(currencies) ? currencies[0] : currencies;

        const embed = Embed.json({
            color: colors.ok,
            thumbnail: { url: currency.image },
            title: `${currency.name} (${currency.symbol.toUpperCase()})`,
            timestamp: new Date(currency.last_updated).toISOString(),
            fields: [
                { name: '**Current Price:**', value: f(currency.current_price), inline: true },
                { name: '**High 24H:**',      value: f(currency.high_24h), inline: true },
                { name: '**Low 24H:**',       value: f(currency.low_24h), inline: true },

                { name: '**Market Cap:**',    value: currency.market_cap.toLocaleString(), inline: true },
                { name: '**Total Volume:**',  value: currency.total_volume.toLocaleString(), inline: true },
                { name: '**Circulating:**',   value: currency.circulating_supply.toLocaleString(), inline: true },

                { name: '**All Time High:**', value: f(currency.ath), inline: true },
                { name: '**% Change ATH:**',  value: `${currency.ath_change_percentage.toFixed(2)}%`, inline: true },
                { name: '**ATH Date:**',      value: time(new Date(currency.ath_date), 'D'), inline: true },

                { name: '**All Time Low:**',  value: f(currency.atl), inline: true },
                { name: '**% Change ATL:**',  value: `${currency.atl_change_percentage.toFixed(2)}%`, inline: true },
                { name: '**ATL Date:**',      value: time(new Date(currency.atl_date), 'D'), inline: true },

                { name: '**Change 24H:**',    value: f(currency.price_change_24h), inline: true },
                { name: '**% Change 24H:**',  value: `${currency.price_change_percentage_24h}%`, inline: true }
            ]
        });

        if (!Array.isArray(currencies))
            return embed;

        return {
            content: currencies.length === 1 ? null : stripIndents`
            There were ${currencies.length} cryptocurrencies with that search query provided.
            If this is the wrong currency, try using one of the following IDs:
            \`\`${currencies.map(c => c.id).join('``, ``')}\`\`
            `.trim(),
            embeds: [embed],
            failIfNotExists: false
        } as ReplyMessageOptions;
    }
}