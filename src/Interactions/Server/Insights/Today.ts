import { pool } from '#khaf/database/Postgres.js';
import { InteractionSubCommand } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { plural } from '#khaf/utility/String.js';
import { time } from '@khaf/builders';
import { CommandInteraction } from 'discord.js';

interface Insights {
    k_left: number 
    k_joined: number
}

export class kSubCommand extends InteractionSubCommand {
    constructor() {
        super({
            references: 'insights',
            name: 'today'
        });
    }

    async handle (interaction: CommandInteraction) {
        const id = interaction.guildId ?? interaction.guild?.id;

        if (!id) {
            return `❌ Re-invite the bot with the correct permissions to use this command!`;
        }

        const { rows } = await pool.query<Insights>(`
            WITH removed AS (
                DELETE FROM kbInsights
                WHERE k_date <= CURRENT_DATE - 14 AND k_guild_id = $1::text
            )

            SELECT k_left, k_joined
            FROM kbInsights
            WHERE 
                k_guild_id = $1::text AND
                k_date = CURRENT_DATE
            ;
        `, [id]);

        const { k_joined = 0, k_left = 0 } = rows[0] ?? {};
        const locale = interaction.guild?.preferredLocale ?? 'en-US';

        return Embed.ok().setDescription(`
        ✅ Here are the insights for today, as of ${time(new Date(), 'f')}!
        
        • ${k_joined.toLocaleString(locale)} member${plural(k_joined)} joined!
        • ${k_left.toLocaleString(locale)} member${plural(k_left)} left!
        `);
    }
}