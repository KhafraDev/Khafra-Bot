import { ClientEvents } from 'discord.js';

export abstract class Event<T extends keyof ClientEvents = keyof ClientEvents> {
    abstract name: T;
    abstract init(...args: ClientEvents[T]): Promise<any>;
}