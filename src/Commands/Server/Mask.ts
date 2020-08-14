import { Command } from "../../Structures/Command";
import { Message, TextChannel } from "discord.js";
import Embed from "../../Structures/Embed";
import { URL } from "url";

export default class extends Command {
    constructor() {
        super(
            { name: 'mask', folder: 'Server' },
            [
                'Get embedded image links that Discord hides.',
                'https://discord.com/channels/677271830838640680/705896160673661041/743569245991862323'
            ],
            [ /* No extra perms needed */ ],
            20
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length === 0) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        let messageURL: URL;
        try {
            messageURL = new URL(args[0]);
            if(messageURL.host !== 'discord.com') {
                return message.channel.send(Embed.fail('Not a message URL!'));
            }
        } catch {
            return message.channel.send(Embed.fail('Invalid message URL provided! Use the ``help`` command for example usage!'));
        }

        const ids = messageURL.toString().split('/').slice(-2);
        if(ids.length !== 2) {
            return message.channel.send(Embed.fail('Invalid message URL!'));
        }

        let channel: TextChannel;
        try {
            channel = await message.client.channels.fetch(ids[0]) as TextChannel; 
        } catch {
            return message.channel.send(Embed.fail('Channel couldn\'t be fetched.'));
        }

        let m: Message;
        try {
            m = await channel.messages.fetch(ids[1]);
        } catch {
            return message.channel.send(Embed.fail('Message couldn\'t be fetched.'));
        }

        if(m.attachments.size !== 0 && m.embeds.length < 1) {
            return message.channel.send(Embed.fail('No image was automatically embedded.'));
        }

        const embed = Embed.success()
            .setTitle('Masked Image URL')
            .setDescription('``' + m.embeds.pop().url + '``');

        return message.channel.send(embed);
    }
}