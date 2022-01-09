import { sql } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { Giveaway } from '#khaf/types/KhafraBot.js';
import { isText } from '#khaf/utility/Discord.js';
import { inlineCode } from '@khaf/builders';
import { ChatInputCommandInteraction } from 'discord.js';

type GiveawayRow = Pick<Giveaway, 'guildid' | 'messageid' | 'channelid' | 'initiator' | 'id' | 'enddate' | 'prize'>;

// https://github.com/nodejs/node/blob/a518e4b871d39f0631beefc79cfa9dd81b82fe9f/test/parallel/test-crypto-randomuuid.js#L20
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'giveaway',
            name: 'delete'
        });
    }

    async handle (interaction: ChatInputCommandInteraction) {
        const id = interaction.options.getString('id', true);

        if (!uuidRegex.test(id)) {
            return `❌ That id is invalid, try again!`;
        } else if (!interaction.guildId || !interaction.guild) {
            return `❌ No guild id provided in the command, re-invite the bot with the correct permissions.`;
        }

        const rows = await sql<GiveawayRow[]>`
            DELETE FROM kbGiveaways
            WHERE
                guildId = ${interaction.guildId}::text AND 
                id = ${id}::uuid
            RETURNING guildId, messageId, channelId, initiator, endDate, prize, id;
        `;

        try {
            const channel = await interaction.guild.channels.fetch(rows[0].channelid);
            if (!isText(channel)) throw ''; // not possible

            const giveawayMessage = await channel.messages.fetch(rows[0].messageid);

            await giveawayMessage.delete();
        } catch {
            return `✅ The giveaway has been stopped, but I could not delete the giveaway message!`
        }

        return `✅ Giveaway ${inlineCode(rows[0].id)} has been deleted!`;
    }
}