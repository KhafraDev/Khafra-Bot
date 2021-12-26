import { Event } from '#khaf/Event';
import { pool } from '#khaf/database/Postgres.js'; 
import { ApplicationCommandPermissionData, Guild, GuildApplicationCommandPermissionData, Permissions } from 'discord.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { join } from 'path';
import { Logger } from '../Structures/Logger.js';
import { KhafraClient } from '../Bot/KhafraBot.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';

const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'));
const logger = new Logger();

export class kEvent extends Event<'guildCreate'> {
    name = 'guildCreate' as const;

    async init(guild: Guild) {
        logger.info(`Joined a new guild!`, {
            id: guild.id,
            name: guild.name
        });

        await pool.query(`
            INSERT INTO kbGuild (
                guild_id, prefix, max_warning_points
            ) VALUES (
                $1::text, $2::text, $3::smallint
            ) ON CONFLICT DO NOTHING;
        `, [guild.id, config.prefix, 20]);

        await dontThrow(guild.roles.fetch());

        const fullPermissions: GuildApplicationCommandPermissionData[] = [];
        
        for (const slashCommand of KhafraClient.Interactions.values()) {
            // if slash command is disabled by default
            if (slashCommand.data.default_permission === false) {
                const interaction = KhafraClient.Interactions.get(slashCommand.data.name)!;
                if (!interaction.options.permissions) continue;

                const perms = new Permissions(interaction.options.permissions);
                const rolesWithPerms = guild.roles.cache.filter(
                    role => role.permissions.has(perms)  
                );
                const commandPerms = rolesWithPerms
                    .map(v => ({ id: v.id, type: 'ROLE', permission: true }))
                    .values() as IterableIterator<ApplicationCommandPermissionData>;

                fullPermissions.push({
                    id: slashCommand.id,
                    permissions: [...commandPerms]
                });
            }
        }

        await dontThrow(guild.commands.permissions.set({
            fullPermissions
        }));
    }
}