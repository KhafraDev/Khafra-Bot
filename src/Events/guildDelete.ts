import { sql } from '#khaf/database/Postgres.js';
import { Event } from '#khaf/Event';
import { Events, type Guild } from 'discord.js';

export class kEvent extends Event<typeof Events.GuildDelete> {
    name = Events.GuildDelete;

    async init (guild: Guild): Promise<void> {
        if (guild.available === false) return;

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