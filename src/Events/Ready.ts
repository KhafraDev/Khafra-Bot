import { Event } from "../Structures/Event";
import { ClientEvents } from "discord.js";
import { formatDate } from "../lib/Utility/Date";

export default class implements Event {
    name: keyof ClientEvents = 'ready';

    init() {
        console.log(`Logged in at ${formatDate('MMMM Do, YYYY hh:mm:ssA', new Date())}`);
    }
}