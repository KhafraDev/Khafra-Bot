import { Event } from '../Structures/Event.js';
import { Interaction, MessageEmbed } from 'discord.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { KhafraClient } from '../Bot/KhafraBot.js';

@RegisterEvent
export class kEvent extends Event {
    name = 'interaction' as const;

    async init(interaction: Interaction) {
        if (!interaction.isCommand()) return;
        if (!KhafraClient.Interactions.has(interaction.commandName)) return;

        const command = KhafraClient.Interactions.get(interaction.commandName);

        try {
            if (command.options?.defer)
                await interaction.defer();

            const result = await command.init(interaction);
            if (typeof result !== 'string' && !(result instanceof MessageEmbed))
                return;

            if (command.options?.defer)
                return interaction.editReply(result);

            return interaction.reply(result);
        } catch (e) {
            // TODO(@KhafraDev): do something with error?
        }
    }
} 