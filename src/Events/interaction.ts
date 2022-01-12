import { KhafraClient } from '#khaf/Bot';
import { Command } from '#khaf/Command';
import { Event } from '#khaf/Event';
import { logger } from '#khaf/Logger';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { interactionReactRoleHandler } from '#khaf/utility/EventEvents/Interaction_ReactRoles.js';
import { Minimalist } from '#khaf/utility/Minimalist.js';
import { upperCase } from '#khaf/utility/String.js';
import { bold, inlineCode } from '@khaf/builders';
import { ChatInputCommandInteraction, Interaction, InteractionReplyOptions, MessageAttachment, MessageContextMenuCommandInteraction, MessageEmbed, UserContextMenuCommandInteraction } from 'discord.js';
import { argv } from 'process';

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

export class kEvent extends Event<'interactionCreate'> {
    name = 'interactionCreate' as const;

    async init(interaction: Interaction): Promise<void> {
        if (interaction.isMessageComponent()) { // "react" roles
            return void dontThrow(interactionReactRoleHandler(interaction, processArgs.get('dev') === true));
        } else if (interaction.isAutocomplete()) {
            const autocomplete = interaction.options.getFocused(true);
            const handler = KhafraClient.Interactions.Autocomplete.get(
                `${interaction.commandName}-${autocomplete.name}`
            );

            if (handler) {
                return handler.handle(interaction);
            }
        }

        if (
            !interaction.isChatInputCommand() && 
            !interaction.isContextMenuCommand()
        ) {
            return;
        }

        const command = interaction.isContextMenuCommand()
            ? KhafraClient.Interactions.UserCommands.get(interaction.commandName)!
            : KhafraClient.Interactions.Commands.get(interaction.commandName)!;

        if (command.options.ownerOnly && !Command.isBotOwner(interaction.user.id)) {
            return void dontThrow(interaction.reply({
                content: `${upperCase(command.data.name)} is ${bold('only')} available to the bot owner!`
            }));
        } else if (disabled.includes(interaction.commandName)) {
            return void dontThrow(interaction.reply({
                content: `${inlineCode(interaction.commandName)} is temporarily disabled!`
            }));
        }

        let err: Error | void;

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
                if (typeof result === 'string') {
                    param.content = result;
                } else if (result instanceof MessageEmbed) {
                    param.embeds = [result];
                } else if (result instanceof MessageAttachment) {
                    param.files = [result];
                } else {
                    Object.assign(param, result);
                }
            }

            if (command.options.replyOpts)
                Object.assign(param, command.options.replyOpts);

            if (interaction.deferred)
                return void await interaction.editReply(param);

            return void await interaction.reply(param);
        } catch (e) {
            err = e as Error;

            if (processArgs.get('dev') === true) {
                console.log(e);
            }
        } finally {
            if (err) {
                logger.error(err);
            } else {
                logger.log(
                    `${interaction.user.tag} (${interaction.user.id}) used the ${command.data.name} interaction!`,
                    {
                        time: interaction.createdAt,
                        channel: interaction.channelId
                    }
                );
            }
        }
    }
} 