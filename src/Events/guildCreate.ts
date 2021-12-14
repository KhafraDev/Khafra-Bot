import { Event } from '../Structures/Event.js';
import { pool } from '../Structures/Database/Postgres.js'; 
import { ApplicationCommandPermissionData, Guild, GuildApplicationCommandPermissionData, Permissions } from 'discord.js';
import { createFileWatcher } from '../lib/Utility/FileWatcher.js';
import { cwd } from '../lib/Utility/Constants/Path.js';
import { join } from 'path';
import { Logger } from '../Structures/Logger.js';
import { KhafraClient } from '../Bot/KhafraBot.js';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';

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

        if (!guild.client.application) {
            return logger.error(new Error(`guild.application is undefined!`));
        }

        const [err, commands] = await dontThrow(guild.client.application.commands.fetch());

        if (err !== null) {
            return logger.error(err);
        }
        
        for (const slashCommand of commands.values()) {
            // if slash command is disabled by default
            if (slashCommand.defaultPermission === false) {
                const interaction = KhafraClient.Interactions.get(slashCommand.name)!;
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