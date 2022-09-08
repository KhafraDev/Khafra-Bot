import { sql } from '#khaf/database/Postgres.js'
import { InteractionSubCommand } from '#khaf/Interaction'
import type { Giveaway } from '#khaf/types/KhafraBot.js'
import { inlineCode } from '@discordjs/builders'
import type { ChatInputCommandInteraction, InteractionReplyOptions, TextChannel } from 'discord.js'

type GiveawayRow = Pick<Giveaway, 'messageid' | 'channelid' | 'id'>

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'giveaway',
            name: 'delete'
        })
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
        const id = interaction.options.getString('id', true)

        if (!uuidRegex.test(id)) {
            return {
                content: '❌ That id is invalid, try again!',
                ephemeral: true
            }
        } else if (interaction.guild === null) {
            return {
                content: '❌ No guild id provided in the command, re-invite the bot with the correct permissions.',
                ephemeral: true
            }
        }

        const rows = await sql<GiveawayRow[]>`
            DELETE FROM kbGiveaways
            WHERE
                kbGiveaways.guildId = ${interaction.guild.id}::text AND
                kbGiveaways.id = ${id}::uuid AND
                kbGiveaways.initiator = ${interaction.user.id}::text
            RETURNING messageId, channelId, id;
        `

        if (rows.length === 0) {
            return {
                content: '❌ No giveaway with that ID exists.',
                ephemeral: true
            }
        }

        const [{ channelid, messageid, id: uuid }] = rows

        try {
            const channel = await interaction.guild.channels.fetch(channelid) as TextChannel | null

            if (channel === null) {
                return {
                    content: '❌ Channel has been deleted or I do not have permission to see it.',
                    ephemeral: true
                }
            }

            const giveawayMessage = await channel.messages.fetch(messageid)

            await giveawayMessage.delete()
        } catch {
            return {
                content: '✅ The giveaway has been stopped, but I could not delete the giveaway message!',
                ephemeral: true
            }
        }

        return {
            content: `✅ Giveaway ${inlineCode(uuid)} has been deleted!`,
            ephemeral: true
        }
    }
}