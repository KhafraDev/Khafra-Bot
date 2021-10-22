import { KhafraClient } from '../Bot/KhafraBot.js';
import { Command } from './Command.js';
import { Event } from './Event.js';

export const RegisterCommand = <T extends new () => Command>(
    CommandConstructor: T,
) => {
    const cmd = new CommandConstructor();
    KhafraClient.Commands.set(cmd.settings.name.toLowerCase(), cmd);

    cmd.settings.aliases!.forEach(alias => KhafraClient.Commands.set(alias, cmd));
}

export const RegisterEvent = <T extends new () => Event>(
    EventConstructor: T,
) => {
    const ev = new EventConstructor();
    KhafraClient.Events.set(ev.name, ev);
}