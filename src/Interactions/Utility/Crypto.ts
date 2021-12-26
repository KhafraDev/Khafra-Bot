import { CommandInteraction, InteractionReplyOptions } from 'discord.js';
import { Interactions } from '#khaf/Interaction';
import { bold, inlineCode, time } from '@khaf/builders';
import { CoinGecko } from '#khaf/utility/commands/CoinGecko';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { stripIndents } from '#khaf/utility/Template.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';

const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format;

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'crypto',
            description: 'Gets information about a cryptocurrency. Kill the environment!',
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'search',
                    description: 'The cryptocurrency\'s name.',
                    required: true
                }
            ]
        };

        super(sc);
    }

    async init(interaction: CommandInteraction) {
        const currencies = await CoinGecko.get(
            interaction.options.getString('search', true),
            () => void dontThrow(interaction.deferReply())
        );

        if (currencies === undefined) {
            return `❌ No currency with that name or id could be found!`;
        }

        const currency = Array.isArray(currencies) ? currencies[0] : currencies;

        const embed = Embed.ok()
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

        if (!Array.isArray(currencies)) return embed;

        return {
            content: currencies.length === 1 ? null : stripIndents`
            There were ${currencies.length} cryptocurrencies with that search query provided.

            If this is the wrong currency, try using one of the following IDs:
            ${currencies.map(c => inlineCode(c.id)).join(', ')}
            `.trim(),
            embeds: [embed],
        } as InteractionReplyOptions;
    }
} 