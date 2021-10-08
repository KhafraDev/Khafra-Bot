import { CommandInteraction, InteractionReplyOptions } from 'discord.js';
import { Interactions } from '../../Structures/Interaction.js';
import { bold, inlineCode, SlashCommandBuilder, time } from '@discordjs/builders';
import { CoinGecko } from '../../lib/Packages/CoinGecko.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { stripIndents } from '../../lib/Utility/Template.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';

const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format;

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('crypto')
            .addStringOption(option => option
                .setName('search')
                .setDescription('The cryptocurrency\'s name.')
                .setRequired(true)    
            )
            .setDescription('Gets info about cryptocurrency! Kill the environment!');

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

        const embed = Embed.success()
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