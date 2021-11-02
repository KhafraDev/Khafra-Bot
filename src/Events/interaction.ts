import { bold, inlineCode } from '@discordjs/builders';
import { Interaction, InteractionReplyOptions, MessageAttachment, MessageEmbed } from 'discord.js';
import { KhafraClient } from '../Bot/KhafraBot.js';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';
import { autoCompleteHandler } from '../lib/Utility/EventEvents/Interaction_AutoComplete.js';
import { interactionReactRoleHandler } from '../lib/Utility/EventEvents/Interaction_ReactRoles.js';
import { Minimalist } from '../lib/Utility/Minimalist.js';
import { upperCase } from '../lib/Utility/String.js';
import { Command } from '../Structures/Command.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { Event } from '../Structures/Event.js';

const processArgs = new Minimalist(process.argv.slice(2).join(' '));
const disabled = typeof processArgs.get('disabled') === 'string'
    ? (processArgs.get('disabled') as string)
        .split(',')
        .map(c => c.toLowerCase())
    : [];

@RegisterEvent
export class kEvent extends Event<'interactionCreate'> {
    name = 'interactionCreate' as const;

    async init(interaction: Interaction): Promise<void> {
        if (interaction.isMessageComponent()) { // "react" roles
            return void dontThrow(interactionReactRoleHandler(interaction, processArgs.get('dev') === true));
        } else if (interaction.isAutocomplete()) {
            return autoCompleteHandler(interaction);
        }
        
        if (!interaction.isCommand()) return;
        if (!KhafraClient.Interactions.has(interaction.commandName)) return;

        const command = KhafraClient.Interactions.get(interaction.commandName)!;

        if (command.options.ownerOnly && !Command.isBotOwner(interaction.user.id)) {
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

            const result = await command.init(interaction);
            const param = {} as InteractionReplyOptions;

            if (interaction.replied) {
                return;
            } else if (result == null) {
                const type = result == null ? `${result}` : Object.prototype.toString.call(result);
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
            if (processArgs.get('dev') === true) {
                console.log(e);
            }
        }
    }
} 