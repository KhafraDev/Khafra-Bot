import { KhafraClient } from '#khaf/Bot';
import { Command } from '#khaf/Command';
import { Event } from '#khaf/Event';
import { logger } from '#khaf/structures/Logger/FileLogger.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { upperCase } from '#khaf/utility/String.js';
import { bold, inlineCode } from '@discordjs/builders';
import {
    Events,
    type AnyInteraction,
    type ChatInputCommandInteraction,
    type InteractionReplyOptions,
    type MessageContextMenuCommandInteraction,
    type UserContextMenuCommandInteraction
} from 'discord.js';
import { argv } from 'node:process';

type Interactions =
    ChatInputCommandInteraction &
    MessageContextMenuCommandInteraction &
    UserContextMenuCommandInteraction;

const processArgs = new Minimalist(argv.slice(2).join(' '));
const disabled = typeof processArgs.get('disabled') === 'string'
    ? (processArgs.get('disabled') as string)
        .split(',')
        .map(c => c.toLowerCase())
    : [];

export class kEvent extends Event<typeof Events.InteractionCreate> {
    name = Events.InteractionCreate;

    async init (interaction: AnyInteraction): Promise<void> {
        if (
            !interaction.isChatInputCommand() &&
            !interaction.isContextMenuCommand()
        ) {
            return;
        }

        const command = interaction.isContextMenuCommand()
            ? KhafraClient.Interactions.Context.get(interaction.commandName)
            : KhafraClient.Interactions.Commands.get(interaction.commandName);

        if (!command) {
            return void dontThrow(interaction.reply({
                content: '❌ This command is no longer available, try to refresh your client!'
            }));
        } else if (command.options.ownerOnly && !Command.isBotOwner(interaction.user.id)) {
            return void dontThrow(interaction.reply({
                content: `${upperCase(command.data.name)} is ${bold('only')} available to the bot owner!`
            }));
        } else if (disabled.includes(interaction.commandName)) {
            return void dontThrow(interaction.reply({
                content: `${inlineCode(interaction.commandName)} is temporarily disabled!`
            }));
        }

        try {
            if (command.options.defer)
                await interaction.deferReply();

            const result = await command.init(interaction as Interactions);
            const param = {} as InteractionReplyOptions;

            if (interaction.replied) {
                return;
            } else if (result == null) {
                const type = Object.prototype.toString.call(result);
                param.content = `❓ Received an invalid type from this response: ${inlineCode(type)}`;
                param.ephemeral = true;
            } else {
                Object.assign(param, result);
            }

            if (command.options.replyOpts)
                Object.assign(param, command.options.replyOpts);

            if (interaction.deferred)
                return void await interaction.editReply(param);

            return void await interaction.reply(param);
        } catch (e) {
            logger.error(e, 'interaction error');
        } finally {
            logger.info(
                {
                    time: interaction.createdAt,
                    channel: interaction.channelId,
                    user: interaction.user,
                    guild: interaction.guild
                },
                `${interaction.user.tag} (${interaction.user.id}) used the ${command.data.name} interaction!`
            );
        }
    }
}