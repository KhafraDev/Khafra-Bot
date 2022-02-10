import { sql } from '#khaf/database/Postgres.js';
import { Event } from '#khaf/Event';
import { Guild } from 'discord.js';

export class kEvent extends Event<'guildDelete'> {
    name = 'guildDelete' as const;

    async init (guild: Guild): Promise<void> {
        await sql<unknown[]>`
            DELETE FROM kbGuild
            WHERE guild_id = ${guild.id}::text;
        `;

        await sql<unknown[]>`
            DELETE FROM kbWarns
            WHERE k_guild_id = ${guild.id}::text;
        `;
    }
}