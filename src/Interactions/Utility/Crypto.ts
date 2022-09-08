import { Interactions } from '#khaf/Interaction'
import { CoinGecko } from '#khaf/utility/commands/CoinGecko'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { bold, time } from '@discordjs/builders'
import type { APIEmbedField, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

const f = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format
const g = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format

const field = (name: string, value: number | string, formatter = f): APIEmbedField => ({
    name: bold(name),
    value: typeof value === 'string' ? value : formatter(value),
    inline: true
})

export class kInteraction extends Interactions {
    constructor () {
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
        }

        super(sc)
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const currency = await CoinGecko.get(interaction.options.getString('search', true))

        if (currency === null) {
            return {
                content: '❌ The cache is being loaded for the first time, please wait a minute!',
                ephemeral: true
            }
        }

        const embed = Embed.json({
            color: colors.ok,
            thumbnail: { url: currency.image.large },
            title: `${currency.name} (${currency.symbol.toUpperCase()})`,
            timestamp: new Date(currency.last_updated).toISOString(),
            fields: [
                field('Current Price:', currency.market_data.current_price.usd),
                field('High (Past day):', currency.market_data.high_24h.usd),
                field('Low (Past day):', currency.market_data.low_24h.usd),

                field('Market Cap:', currency.market_data.market_cap.usd),
                field('Total Volume:', currency.market_data.total_volume.usd),
                field('Circulating:', currency.market_data.circulating_supply, g),

                field('All Time High:', currency.market_data.ath.usd),
                field(
                    'All Time High Change:',
                    `${g(currency.market_data.ath_change_percentage.usd)}%`),
                field('All Time High Date:', time(new Date(currency.market_data.ath_date.usd))),

                field('All Time Low:', currency.market_data.atl.usd),
                field(
                    'All Time Low Change:',
                    `${g(currency.market_data.atl_change_percentage.usd)}%`
                ),
                field('All Time Low Date:', time(new Date(currency.market_data.atl_date.usd)))
            ]
        })

        return {
            embeds: [embed]
        }
    }
}