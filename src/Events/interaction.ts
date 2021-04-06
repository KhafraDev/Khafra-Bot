import { Event } from '../Structures/Event.js';
import { Interaction } from 'discord.js';
import { RegisterEvent } from '../Structures/Decorator.js';
import { KhafraClient } from '../Bot/KhafraBot.js';

@RegisterEvent
export class kEvent extends Event {
    name = 'interaction' as const;

    async init(interaction: Interaction) {
        if (!interaction.isCommand()) return;
        if (!KhafraClient.Interactions.has(interaction.commandName)) return;

        return KhafraClient.Interactions.get(interaction.commandName).init(interaction);
    }
}