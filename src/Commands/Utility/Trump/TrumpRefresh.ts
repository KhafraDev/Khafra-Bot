import { Command } from "../../../Structures/Command.js";
import { Message } from "discord.js";
import { refreshCache, cache } from "./Trump.js";

export default class extends Command {    
    constructor() {
        super(
            [
                'Refresh the atrocities committed by Trump!',
                '',
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'trumprefresh',
                folder: 'Utility',
                args: [0, 0],
                ownerOnly: true
            }
        );
    }

    async init(message: Message) {
        let items;
        try {
            items = await refreshCache();
        } catch(e) {
            return message.reply(this.Embed.fail(`
            An error occurred!
            \`\`${e.toString()}\`\`
            `));
        }

        const old = cache.length;
        cache.length = 0; // removes all items from array
        cache.push(...items);
        return message.reply(this.Embed.success(`
        Successfully refreshed the cache.
        ${cache.length - old} atrocities added!
        `));
    }
}