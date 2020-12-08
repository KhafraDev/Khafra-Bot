import { Command } from "../../Structures/Command.js";
import { APOD_BULK_FETCH, APOD_SAVE, APOD_CLEAR_BAD } from "../../lib/Backend/NASA.js";
import { Message } from "discord.js";

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch more APOD images.',
                ''
            ],
			{
                name: 'apodfetch',
                folder: 'Utility',
                args: [0, 0],
                aliases: [ 'nasafetch', 'apodrefresh', 'nasarefresh' ],
                ownerOnly: true
            }
        );
    }

    async init(message: Message) {
        message.channel.startTyping();
        try {
            await APOD_BULK_FETCH();
        } catch(e) {
            await message.reply(this.Embed.fail(`
            An error occurred: this could be because we reached APOD's EPOCH or for another reason.

            Data fetched has been saved, nothing to worry about.
            `));
        } finally {
            message.channel.stopTyping();
            await APOD_SAVE();
            await APOD_CLEAR_BAD();
        }

        return message.reply(this.Embed.success(`Data was saved successfully!`));
    }
}