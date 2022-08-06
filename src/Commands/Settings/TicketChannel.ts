import { cache } from '#khaf/cache/Settings.js'
import type { Arguments} from '#khaf/Command'
import { Command } from '#khaf/Command'
import { sql } from '#khaf/database/Postgres.js'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { isCategory, isExplicitText } from '#khaf/utility/Discord.js'
import { getMentions } from '#khaf/utility/Mentions.js'
import { hasPerms } from '#khaf/utility/Permissions.js'
import type { APIEmbed} from 'discord-api-types/v10'
import { GuildPremiumTier, PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Select a channel to create private ticket threads on (if the server has enough boosts), ' +
                'or a category channel to create ticket channels in.',
                '866022233330810930 [channel id]',
                '#general [channel mention]'
            ],
            {
                name: 'ticketchannel',
                folder: 'Settings',
                aliases: ['ticketchannels'],
                args: [1, 1],
                ratelimit: 10,
                guildOnly: true
            }
        )
    }

    async init (message: Message<true>, _args: Arguments, settings: kGuild): Promise<APIEmbed> {
        if (!hasPerms(message.channel, message.member, PermissionFlagsBits.Administrator)) {
            return Embed.perms(
                message.channel,
                message.member,
                PermissionFlagsBits.Administrator
            )
        }

        /** guild can use private threads */
        const privateThreads =
            message.guild.premiumTier !== GuildPremiumTier.None &&
            message.guild.premiumTier !== GuildPremiumTier.Tier1

        const ticketChannel = await getMentions(message, 'channels')

        if (!isExplicitText(ticketChannel) && !isCategory(ticketChannel)) {
            return Embed.error(`${ticketChannel ?? 'None'} is not a text or category channel!`)
        } else if (isExplicitText(ticketChannel) && !privateThreads) {
            return Embed.error('This guild cannot use private threads, please use a category channel instead!')
        }

        const rows = await sql<kGuild[]>`
            UPDATE kbGuild
            SET ticketChannel = ${ticketChannel.id}::text
            WHERE guild_id = ${message.guildId}::text
            RETURNING *;
        `

        cache.set(message.guild.id, rows[0])

        return Embed.ok(`Changed the default ticket channel to ${ticketChannel} (was: ${settings.ticketchannel ?? 'N/A'})!`)
    }
}