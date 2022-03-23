import { KhafraClient, rest } from '#khaf/Bot';
import { InteractionSubCommand } from '#khaf/Interaction';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { inlineCode } from '@discordjs/builders';
import { APIApplicationCommand, Routes } from 'discord-api-types/v10';
import { ChatInputCommandInteraction } from 'discord.js';
import { join } from 'path';

const config = createFileWatcher(
	{} as typeof import('../../../../config.json'),
	join(cwd, 'config.json')
);

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'interaction',
            name: 'delete'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string> {
        const commandName = interaction.options.getString('command-name', true);
        const command = KhafraClient.Interactions.Commands.get(commandName.toLowerCase());
        const globally = interaction.options.getBoolean('globally');

        if (!command) {
            return `❌ Command "${inlineCode(commandName)}" does not exist, idiot.`;
        } else if (!interaction.guild) {
            return '❌ Not in a guild.';
        }

        if (globally !== true) {
            const commands = await rest.get(
                Routes.applicationGuildCommands(config.botId, config.guildId)
            ) as APIApplicationCommand[];
            const commandId = commands.find(c => c.name === command.data.name);

            if (!commandId) {
                return '❌ Command doesn\'t exist in the guild.';
            }

            // https://discord.com/developers/docs/interactions/application-commands#delete-guild-application-command
            await rest.delete(
                Routes.applicationGuildCommand(config.botId, config.guildId, commandId.id)
            );
        } else {
            const commands = await rest.get(
                Routes.applicationCommands(config.botId)
            ) as APIApplicationCommand[];

            const commandId = commands.find(c => c.name === command.data.name);

            if (!commandId) {
                return '❌ Command doesn\'t exist.';
            }

            // https://discord.com/developers/docs/interactions/application-commands#delete-global-application-command
            await rest.delete(
                Routes.applicationCommand(config.botId, commandId.id)
            );
        }

        return `✅ Command "${inlineCode(commandName)}" has been deleted!`;
    }
}