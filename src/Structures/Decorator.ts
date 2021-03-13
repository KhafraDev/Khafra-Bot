import { KhafraClient } from '../Bot/KhafraBot.js';
import { Command } from './Command.js';
import { Event } from './Event.js';

export const RegisterCommand = <T extends new (...args: unknown[]) => Command>(
    CommandConstructor: T,
) => {
    const cmd = new CommandConstructor();
    KhafraClient.Commands.set(cmd.settings.name.toLowerCase(), cmd);

    cmd.settings.aliases.forEach(alias => KhafraClient.Commands.set(alias, cmd));

    if (cmd.middleware.length > 0)
        cmd.middleware.forEach(v => v());

    if (cmd.help.length < 2) // fill array to min length 2
        cmd.help = [...cmd.help, ...Array<string>(2 - cmd.help.length).fill('')];
}

export const RegisterEvent = <T extends new (...args: unknown[]) => Event>(
    EventConstructor: T,
) => {
    const ev = new EventConstructor();
    KhafraClient.Events.set(ev.name, ev);
}