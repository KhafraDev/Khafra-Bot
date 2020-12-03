import { Command } from "../../../Structures/Command.js";
import { Message, MessageAttachment } from "discord.js";
import fetch from "node-fetch";

export default class extends Command {
    constructor() {
        super(
            [
                'This horse does not exist!',
                ''
            ],
			{
                name: 'thishorsedoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thishorsedoesn\'texist', 'thdne' ]
            }
        );
    }

    async init(message: Message) {
        let buf: Buffer;
        try {
            const res = await fetch('https://thishorsedoesnotexist.com/');
            buf = await res.buffer();
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server had a problem!'));
            }
            
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        const attach = new MessageAttachment(buf, 'thdne.jpeg');
        const embed = this.Embed.success()
            .attachFiles([ attach ])
            .setImage('attachment://thdne.jpeg');

        return message.reply(embed);
    }
}