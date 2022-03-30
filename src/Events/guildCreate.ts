import { KhafraClient } from '#khaf/Bot';
import { sql } from '#khaf/database/Postgres.js';
import { Event } from '#khaf/Event';
import { logger } from '#khaf/Logger';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { ApplicationCommandPermissionType } from 'discord-api-types/v10';
import type { Guild, GuildApplicationCommandPermissionData } from 'discord.js';

export class kEvent extends Event<'guildCreate'> {
    name = 'guildCreate' as const;

    async init (guild: Guild): Promise<void> {
        logger.info('Joined a new guild!', {
            id: guild.id,
            name: guild.name
        });

        await sql<unknown[]>`
            INSERT INTO kbGuild (
                guild_id, max_warning_points
            ) VALUES (
                ${guild.id}::text, ${20}::smallint
            ) ON CONFLICT DO NOTHING;
        `;

        await dontThrow(guild.roles.fetch());

        const fullPermissions: GuildApplicationCommandPermissionData[] = [];

        for (const slashCommand of KhafraClient.Interactions.Commands.values()) {
            // if slash command is disabled by default
            if (slashCommand.data.default_permission === false) {
                const interaction = KhafraClient.Interactions.Commands.get(slashCommand.data.name)!;
                if (!interaction.options.permissions) continue;

                const perms = interaction.options.permissions;
                const rolesWithPerms = guild.roles.cache.filter(
                    role => role.permissions.has(perms)
                );
                const commandPerms = rolesWithPerms
                    .map(v => ({ id: v.id, type: ApplicationCommandPermissionType.Role, permission: true }))
                    .values();

                fullPermissions.push({
                    id: slashCommand.id,
                    permissions: [...commandPerms]
                });
            }
        }

        try {
            return void await guild.commands.permissions.set({ fullPermissions });
        } catch {
            // No permission to create slash commands, don't bother.
        }
    }
}