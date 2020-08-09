import { Command } from '../../Structures/Command';
import { Message, TextChannel } from 'discord.js';
import Embed from '../../Structures/Embed';
import { formatDate } from '../../Backend/Utility/Date';

export default class extends Command {
    constructor() {
        super(
            { name: 'channel', folder: 'Server' },
            [
                'Get info on a specified channel!',
                '#general',
                '705896160673661041'
            ],
            [ /* No extra perms needed */ ],
            5,
            [ 'chan', 'channelinfo' ]
        );
    }

    async init(message: Message, args: string[]): Promise<Message> {
        let channel: TextChannel;
        if(args.length === 0) {
            channel = message.channel as TextChannel;
        } else if(message.mentions.channels.size === 0) {
            try {
                channel = await message.client.channels.fetch(args[0]) as TextChannel;
            } catch {
                channel = message.channel as TextChannel;   
            }
        } else {
            channel = message.mentions.channels.first() as TextChannel;
        }

        const embed = Embed.success()
            .setAuthor(message.client.user.username, message.client.user.displayAvatarURL())
            .setTimestamp()
            .setDescription(`
            ${channel.toString()}
            \`\`${channel.topic?.length ? channel.topic : 'No topic set'}\`\`
            `)
            .addField('**ID:**',         channel.id, true)
            .addField('**Type:**',       channel.type, true)
            .addField('**Name:**',       channel.name, true)
            .addField('**NSFW:**',       channel.nsfw ? 'Yes' : 'No', true)
            .addField('**Parent:**',     channel.parent?.toString() ?? 'None', true)
            .addField('**Rate-limit:**', (channel.rateLimitPerUser?.toLocaleString() ?? 0) + ' secs', true)
            .addField('**Created:**',    formatDate('MMMM Do, YYYY hh:mm:ssA', channel.createdAt), true)

        return message.channel.send(embed);
    }
}