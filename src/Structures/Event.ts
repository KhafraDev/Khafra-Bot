import { ClientEvents } from "discord.js";

type valueof<T> = T[keyof T];

class Event {
    name: keyof ClientEvents;

    constructor(name: keyof ClientEvents) {
        this.name = name;
    }

    init(...args: valueof<ClientEvents>): any {

    }
}

export { Event };