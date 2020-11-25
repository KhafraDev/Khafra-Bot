import { Command } from "../../Structures/Command.js";
import { Message, MessageAttachment } from "discord.js";
import fetch from "node-fetch";

export default class extends Command {
    constructor() {
        super(
            [
                'This person does not exist!',
                ''
            ],
			{
                name: 'thispersondoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thispersondoesn\'texist', 'tpdne' ]
            }
        );
    }

    async init(message: Message) {
        // It's likely that discord caches the response, as if you just set
        // this url as the image (in MessageEmbed#setImage) it'll be the
        // same every time. This uses way more resources but it's the only way. :(
        let buf: Buffer;
        try {
            const res = await fetch('https://thispersondoesnotexist.com/image');
            buf = await res.buffer();
        } catch {
            return message.reply(this.Embed.fail(
                'An error occurred getting a person!'
            ));
        }

        // so we can use a buffer, attachFiles doesn't allow one by itself
        const attach = new MessageAttachment(buf, 'tpdne.jpeg');
        const embed = this.Embed.success()
            .attachFiles([ attach ])
            .setImage('attachment://tpdne.jpeg');

        return message.reply(embed);
    }
}