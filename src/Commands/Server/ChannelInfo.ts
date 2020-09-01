import { Command } from '../../Structures/Command';
import { Message, TextChannel, VoiceChannel, Channel, NewsChannel } from 'discord.js';
import Embed from '../../Structures/Embed';
import { formatDate } from '../../lib/Utility/Date';

export default class extends Command {
    constructor() {
        super(
            [
                'Get info on a specified channel!',
                '#general',
                '705896160673661041'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'channel',
                folder: 'Server',
                aliases: [ 'chan', 'channelinfo' ],
                cooldown: 5,
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(!/<?#?\d{17,19}>?/.test(args[0])) {
            return message.channel.send(Embed.missing_args.call(this, 1, 'Invalid Channel ID or mention!'));
        }

        let _channel: Channel = message.mentions.channels.first();
        if(!_channel) {
            try {
                _channel = await message.client.channels.fetch(args[0]);
            } catch {
                return message.channel.send(Embed.missing_args.call(this, 1, 'Invalid Channel ID provided!'));
            }
        }

        if(['text', 'news', 'voice'].indexOf(_channel.type) === -1) {
            return message.channel.send(Embed.fail('Only text, news, and voice channels are allowed!'));
        }

        const channel = _channel as TextChannel | NewsChannel | VoiceChannel;

        const embed = Embed.success()
            .setAuthor(message.client.user.username, message.client.user.displayAvatarURL())
            .addField('**ID:**',     channel.id, true)
            .addField('**Type:**',   channel.type, true)
            .addField('**Name:**',   channel.name, true)
            .addField('**Parent:**', channel.parent?.toString() ?? 'None', true)
            .setFooter(`Created ${formatDate('MMMM Do, YYYY hh:mm:ssA', channel.createdAt)}`);

        if(channel instanceof TextChannel || channel instanceof NewsChannel) {
            embed
                .setDescription(`${channel.toString()}\n${channel.topic ?? 'No topic set!'}`)
                .addField('**NSFW:**',       channel.nsfw ? 'Yes' : 'No', true)
                .addField('**Rate-limit:**', channel instanceof TextChannel ? (channel.rateLimitPerUser?.toLocaleString() ?? 0) + ' secs' : 'None', true)
        } else if(channel instanceof VoiceChannel) {
            embed
                .addField('**Bitrate:**',   channel.bitrate.toLocaleString(), true)
                .addField('**Full:**',      channel.full ? 'Yes' : 'No', true)
                .addField('**Max Users:**', channel.userLimit === 0 ? 'Unlimited' : channel.userLimit, true)
        }

        return message.channel.send(embed);
    }
}