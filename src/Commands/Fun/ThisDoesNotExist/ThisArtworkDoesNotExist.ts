import { Command } from "../../../Structures/Command.js";
import { Message, MessageAttachment } from "discord.js";
import fetch from "node-fetch";

export default class extends Command {
    constructor() {
        super(
            [
                'This artwork does not exist!',
                ''
            ],
			{
                name: 'thisartworkdoesnotexist',
                folder: 'Fun',
                args: [0, 0],
                aliases: [ 'thisartworkdoesn\'texist', 'tadne', 'thisartdoesnotexist', 'thisartdoesn\'texist' ]
            }
        );
    }

    async init(message: Message) {
        let res;
        try {
            res = await fetch('https://thisartworkdoesnotexist.com/');
        } catch(e) {
            if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server had a problem!'));
            }
            
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        const attach = new MessageAttachment(res.body, 'tadne.jpeg');
        const embed = this.Embed.success()
            .attachFiles([ attach ])
            .setImage('attachment://tadne.jpeg');

        return message.reply(embed);
    }
}