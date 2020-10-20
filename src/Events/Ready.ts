import { Event } from "../Structures/Event.js";
import { ClientEvents } from "discord.js";
import { formatDate } from "../lib/Utility/Date.js";

export default class implements Event {
    name: keyof ClientEvents = 'ready';

    init() {
        console.log(`Logged in at ${formatDate('MMMM Do, YYYY hh:mm:ssA', new Date())}`);
    }
}