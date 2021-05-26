import { KhafraClient } from '../Bot/KhafraBot.js';
import { client } from '../index.js';
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

    if (cmd.help.length < 2) // fill array to min length 2
        cmd.help = [...cmd.help, ...Array<string>(2 - cmd.help.length).fill('')];

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

    // TODO(@KhafraDev): set this as a global slash command. 
    client.guilds.cache.get('503024525076725771').commands.create(interaction.data)
        .catch(e => console.log(e));
    KhafraClient.Interactions.set(interaction.data.name, interaction);
}