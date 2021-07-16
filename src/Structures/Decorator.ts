import { KhafraClient } from '../Bot/KhafraBot.js';
import { client } from '../index.js';
import { dontThrow } from '../lib/Utility/Don\'tThrow.js';
import { Command } from './Command.js';
import { CommandCooldown } from './Cooldown/CommandCooldown.js';
import { Event } from './Event.js';
import { Interactions } from './Interaction.js';

export const RegisterCommand = <T extends new (...args: unknown[]) => Command>(
    CommandConstructor: T,
) => {
    const cmd = new CommandConstructor();
    KhafraClient.Commands.set(cmd.settings.name.toLowerCase(), cmd);

    cmd.settings.aliases.forEach(alias => KhafraClient.Commands.set(alias, cmd));

    CommandCooldown.set(cmd.settings.name.toLowerCase(), new Set());
}

export const RegisterEvent = <T extends new (...args: unknown[]) => Event>(
    EventConstructor: T,
) => {
    const ev = new EventConstructor();
    KhafraClient.Events.set(ev.name, ev);
}

export const RegisterInteraction = <T extends new (...args: unknown[]) => Interactions>(
    InteractionObject: T
) => {
    const interaction = new InteractionObject();

    void dontThrow(client.application.commands.create(interaction.data));

    // There isn't a better way to check if a bot can make a slash command "yet".
    // https://discord.com/channels/222078108977594368/824410868505903114/848343604308475934
    void dontThrow(client.guilds.cache.get('503024525076725771')?.commands.create(interaction.data));

    KhafraClient.Interactions.set(interaction.data.name, interaction);
}