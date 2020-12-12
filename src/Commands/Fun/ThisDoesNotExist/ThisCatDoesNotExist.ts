import { Command } from "../../../Structures/Command.js";
import { Message, MessageAttachment } from "discord.js";
import fetch from "node-fetch";

export default class extends Command {
    constructor() {
        super(
            [
                'This cat does not exist!',
                ''
            ],
			{
                name: 'thiscatdoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thiscatdoesn\'texist', 'tcdne' ]
            }
        );
    }

    async init(message: Message) {
        let res;
        try {
            res = await fetch('https://thiscatdoesnotexist.com');
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server had a problem!'));
            }
            
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        const attach = new MessageAttachment(res.body, 'tcdne.jpeg');
        const embed = this.Embed.success()
            .attachFiles([ attach ])
            .setImage('attachment://tcdne.jpeg');

        return message.reply(embed);
    }
}