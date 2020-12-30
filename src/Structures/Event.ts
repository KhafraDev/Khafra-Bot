import { ClientEvents } from 'discord.js';

type valueof<T> = T[keyof T];

interface Event {
    name: keyof ClientEvents;
    init(...args: valueof<ClientEvents>): unknown;
}

export { Event };