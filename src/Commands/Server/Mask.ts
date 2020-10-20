import { Command } from "../../Structures/Command.js";
import { Message, TextChannel } from "discord.js";
import { URL } from "url";

export default class extends Command {
    constructor() {
        super(
            [
                'Get embedded image links that Discord hides.',
                'https://discord.com/channels/677271830838640680/705896160673661041/743569245991862323'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'mask',
                folder: 'Server',
                args: [1, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        let messageURL: URL;
        try {
            messageURL = new URL(args[0]);
        } catch {
            return message.channel.send(this.Embed.fail('Invalid message URL provided! Use the ``help`` command for example usage!'));
        }

        if(messageURL.host !== 'discord.com') {
            return message.channel.send(this.Embed.generic());
        }

        const ids = messageURL.toString().split('/').slice(-2);
        if(ids.length !== 2) {
            return message.channel.send(this.Embed.generic());
        } else if(!ids.every(id => id.length >= 17 && id.length <= 19)) {
            return message.channel.send(this.Embed.generic());
        }

        let channel: TextChannel;
        try {
            channel = await message.client.channels.fetch(ids[0]) as TextChannel; 
        } catch {
            return message.channel.send(this.Embed.fail('Channel couldn\'t be fetched.'));
        }

        let m: Message;
        try {
            m = await channel.messages.fetch(ids[1]);
        } catch {
            return message.channel.send(this.Embed.fail('Message couldn\'t be fetched.'));
        }

        // message has no embeds
        if(m.embeds.length === 0) {
            return message.channel.send(this.Embed.fail('No image was embedded!'));
        }

        const embed = this.Embed.success()
            .setTitle('Masked Image URL' + (m.embeds.length === 1 ? '' : 's'))
            .setDescription(m.embeds.map(e => `\`\`${e.url ?? 'No URL'}\`\``).join('\n').slice(0, 2048));

        return message.channel.send(embed);
    }
}