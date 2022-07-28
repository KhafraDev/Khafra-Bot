import { KhafraClient } from '#khaf/Bot';
import { Event } from '#khaf/Event';
import { Events, InteractionType, type Interaction } from 'discord.js';

export class kEvent extends Event<typeof Events.InteractionCreate> {
    name = Events.InteractionCreate as const;

    async init (interaction: Interaction): Promise<void> {
        if (interaction.type !== InteractionType.ApplicationCommandAutocomplete) {
            return;
        }

        const autocomplete = interaction.options.getFocused(true);
        const handler = KhafraClient.Interactions.Autocomplete.get(
            `${interaction.commandName}-${autocomplete.name}`
        );

        return handler?.handle(interaction);
    }
}