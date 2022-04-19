import { Interactions } from '#khaf/Interaction';
import { CoinGecko } from '#khaf/utility/commands/CoinGecko';
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { stripIndents } from '#khaf/utility/Template.js';
import { bold, inlineCode, time } from '@discordjs/builders';
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord-api-types/v10';
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';

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

    async init(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const currencies = await CoinGecko.get(
            interaction.options.getString('search', true),
            () => void dontThrow(interaction.deferReply())
        );

        if (currencies === undefined) {
            return {
                content: '❌ The cache is being loaded for the first time, please wait a minute!',
                ephemeral: true
            }
        } else if (currencies.length === 0) {
            return {
                content: '❌ No currency with that name or id could be found!',
                ephemeral: true
            }
        }

        const currency = Array.isArray(currencies) ? currencies[0] : currencies;

        const embed = Embed.json({
            color: colors.ok,
            thumbnail: { url: currency.image },
            title: `${currency.name} (${currency.symbol.toUpperCase()})`,
            timestamp: new Date(currency.last_updated).toISOString(),
            fields: [
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
            ]
        });

        if (!Array.isArray(currencies)) {
            return {
                embeds: [embed]
            }
        }

        return {
            content: currencies.length === 1 ? null : stripIndents`
            There were ${currencies.length} cryptocurrencies with that search query provided.

            If this is the wrong currency, try using one of the following IDs:
            ${currencies.map(c => inlineCode(c.id)).join(', ')}
            `.trim(),
            embeds: [embed]
        }
    }
}