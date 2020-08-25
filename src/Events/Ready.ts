import { Event } from "../Structures/Event";
import { ClientEvents } from "discord.js";

export default class implements Event {
    name: keyof ClientEvents = 'ready';

    init() {
        console.log('Logged in!');
    }
}