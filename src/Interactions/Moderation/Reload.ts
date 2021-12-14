import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction, GuildApplicationCommandPermissionData, GuildMember, Permissions } from 'discord.js';
import { KhafraClient } from '../../Bot/KhafraBot.js';
import { inlineCode } from '../../lib/Packages/@khaf-builders/index.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { Interactions } from '../../Structures/Interaction.js';

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
        if (!interaction.client.application) {
            return `❌ I have no idea why you are getting this error.`;
        }

        let member = interaction.member;

        if (!member || !interaction.guild) {
            return `❌ You need to re-invite the bot with default permissions for this to work. Thank Discord for this feature.`;
        } else if (!(member instanceof GuildMember)) {
            member = Reflect.construct(GuildMember, [
                interaction.client,
                member,
                interaction.guild
            ]) as GuildMember;
        }

        if (!hasPerms(interaction.channel, member, Permissions.FLAGS.ADMINISTRATOR)) {
            return ( 
                `❌ Either you don't have permission or you need to re-invite the bot with default permissions ` + 
                `- this is not a design choice by me, thanks Discord!`
            );
        }

        const nameOption = interaction.options.getString('command', true).toLowerCase();
        const cachedCommand = KhafraClient.Interactions.get(nameOption);

        if (!cachedCommand) {
            return `❌ Command does not exist.`;
        }

        const application = await interaction.client.application.fetch();
        const allCommands = await application.commands.fetch();
        const command = allCommands.find(c => c.name === nameOption);

        if (!command) {
            return `❌ No slash command with this name could be found.`;
        } else if (command.defaultPermission !== false) {
            return `❌ This command is already available to all guild members`;
        }

        const perms = new Permissions(cachedCommand.options.permissions);
        const allRoles = await interaction.guild.roles.fetch();
        const roles = allRoles.filter(role => role.permissions.has(perms));
        const fullPermissions: GuildApplicationCommandPermissionData[] = [];

        for (const role of roles.values()) {
            fullPermissions.push({
                id: command.id,
                permissions: [{
                    id: role.id,
                    type: 'ROLE',
                    permission: true
                }]
            });
        }

        const [setError] =await dontThrow(interaction.guild.commands.permissions.set({
            fullPermissions
        }));

        if (setError !== null) {
            return `❌ An unexpected error occured: ${inlineCode(setError.message)}`;
        }

        return Embed.ok(`✅ Update ${inlineCode(cachedCommand.data.name)} to allow ${roles.map(v => `${v}`).join(', ')} to use it.`);
    }
} 