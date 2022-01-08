import { KhafraClient } from '#khaf/Bot';
import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { hasPerms } from '#khaf/utility/Permissions.js';
import { inlineCode } from '@khaf/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { ApplicationCommand, CommandInteraction, GuildApplicationCommandPermissionData, GuildMember, Permissions } from 'discord.js';
import { join } from 'path';
import { argv } from 'process';

const config = createFileWatcher({} as typeof import('../../../config.json'), join(cwd, 'config.json'));
const processArgs = new Minimalist(argv.slice(2).join(' '));
const isDev = processArgs.get('dev') === true;
const guildDebuggingCommands: ApplicationCommand[] = [];

export class kInteraction extends Interactions {
    constructor() {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'reload',
            description: 'Update permissions for a slash command.',
            default_permission: true,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'command',
                    description: 'Command name to update permissions for.',
                    required: true
                }
            ]
        };

        super(sc, { defer: true });
    }

    async init(interaction: CommandInteraction) {
        const member = interaction.member;

        if (!member || !interaction.guild) {
            return `❌ You need to re-invite the bot with default permissions for this to work. Thank Discord for this feature.`;
        } else if (!(member instanceof GuildMember)) {
            return `❌ Re-invite the bot with the correct permissions to use this command!`;
        }

        if (!hasPerms(interaction.channel, member, Permissions.FLAGS.ADMINISTRATOR)) {
            return ( 
                `❌ Either you don't have permission or you need to re-invite the bot with default permissions ` + 
                `- this is not a design choice by me, thanks Discord!`
            );
        }

        const nameOption = interaction.options.getString('command', true).toLowerCase();
        const cachedCommand = KhafraClient.Interactions.Commands.get(nameOption);

        if (!cachedCommand) {
            return `❌ Command does not exist.`;
        } else if (cachedCommand.data.default_permission !== false) {
            return `❌ This command is already available to all guild members`;
        }

        const perms = new Permissions(cachedCommand.options.permissions);
        const allRoles = await interaction.guild.roles.fetch();
        const roles = allRoles.filter(role => role.permissions.has(perms));
        const fullPermissions: GuildApplicationCommandPermissionData = {
            id: cachedCommand.id,
            permissions: []
        };

        for (const role of roles.values()) {
            fullPermissions.permissions.push({
                id: role.id,
                type: 'ROLE',
                permission: true
            });
        }

        const permissions = interaction.guild.commands.permissions;
        const [setError] = await dontThrow(permissions.set({
            fullPermissions: [fullPermissions]
        }));

        if (setError !== null) {
            return `❌ An unexpected error occured: ${inlineCode(setError.message)}`;
        }

        if (isDev && interaction.guildId === config.guildId) {
            if (guildDebuggingCommands.length === 0) {
                const commands = await interaction.guild.commands.fetch();
                guildDebuggingCommands.push(...commands.values());
            }

            const command = guildDebuggingCommands.find(c => c.name === nameOption);

            if (command) {
                fullPermissions.id = command.id;
                await dontThrow(permissions.set({
                    fullPermissions: [fullPermissions]
                }));
            }
        }

        return Embed.ok(`✅ Update ${inlineCode(cachedCommand.data.name)} to allow ${roles.map(v => `${v}`).join(', ')} to use it.`);
    }
} 