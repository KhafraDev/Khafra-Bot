import { KhafraClient } from '#khaf/Bot'
import { sql } from '#khaf/database/Postgres.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import type { Giveaway } from '#khaf/types/KhafraBot'
import * as DiscordUtil from '#khaf/utility/Discord.js'
import { plural } from '#khaf/utility/String.js'
import { stripIndents } from '#khaf/utility/Template.js'
import { inlineCode, time } from '@discordjs/builders'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'giveaway',
            name: 'reroll'
        })
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        if (interaction.guild === null) {
            return {
                content: '❌ Unable to use the command.',
                ephemeral: true
            }
        }

        const idOrText = interaction.options.getString('giveaway-id-or-prize', true)
        const where = uuidRegex.test(idOrText)
            ? sql`kbGiveaways.id = ${idOrText}::uuid`
            : sql`kbGiveaways.prize LIKE ${`%${idOrText}%`}`

        const [giveaway] = await sql<[Giveaway?]>`
            SELECT * FROM kbGiveaways
            WHERE
                ${where} AND
                kbGiveaways.guildid = ${interaction.guild.id}::text AND
                kbGiveaways.initiator = ${interaction.user.id}::text AND
                kbGiveaways."didEnd" = TRUE::boolean
            LIMIT 1;
        `

        if (!giveaway) {
            return {
                content: '❌ No giveaways were found, is it older than a week?',
                ephemeral: true
            }
        }

        const { channelid, winners, enddate, id } = giveaway
        const channel = await interaction.guild.channels.fetch(channelid)

        if (
            channel === null ||
            !DiscordUtil.isTextBased(channel)
        ) {
            return {
                content: '❌ I couldn\'t find the channel.',
                ephemeral: true
            }
        }

        // Edit the old message & handles all the logic.
        const timer = KhafraClient.Timers.get('GiveawayTimer')!
        await timer.action(giveaway)

        return {
            content: stripIndents`
            ✅ Re-rolled the giveaway in ${channel} if it was possible.

            • ${winners} winner${plural(winners)}
            • Ends ${time(enddate)}
            • ID ${inlineCode(id)}`
        }
    }
}