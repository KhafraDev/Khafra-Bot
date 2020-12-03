import { Message } from "discord.js";
import { Command } from "../../Structures/Command.js";
import { cartoonize } from "../../lib/Backend/Cartoonize.js";
import { cooldown } from '../../Structures/Cooldown/CommandCooldown.js';

export default class extends Command {
    cooldown = cooldown(1, 30000);

    constructor() {
        super(
            [
                'Cartoonize an image using AI.',
                '[attached image]'
            ],
			{
                name: 'cartoonize',
                folder: 'Utility',
                args: [0, 0],
                aliases: [ 'cartoon' ],
                guildOnly: true
            }
        );
    }

    async init(message: Message) {
        if(message.attachments.size === 0) {
            return message.reply(this.Embed.generic('No image attached!'));
        } else if(!this.cooldown(message.guild.id) || !this.cooldown(message.author.id)) {
            return message.reply(this.Embed.fail('Command is rate-limited once per 30 seconds per user and guild.'));
        }

        message.channel.startTyping();
        
        let cartoon: string;
        try {
            cartoon = await cartoonize(message.attachments.first());
        } catch(e) {
            message.channel.stopTyping();
            if(e.name === 'TypeError') {
                return message.reply(this.Embed.fail('Image wasn\'t found on page.'));
            } else if(e.name === 'FetchError') {
                return message.reply(this.Embed.fail('Server had an issue processing the request.'));
            } else if(e.name === 'AssertionError') {
                return message.reply(this.Embed.fail('Check failed.'));
            } 

            return message.reply(this.Embed.fail('An unknown error occurred!'));
        }

        message.channel.stopTyping();
        return message.reply(this.Embed
            .success(`[Click Here](${cartoon}) to download!`)
            .setImage(cartoon)
        );
    }
}
