import Command from '../../Structures/Command';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import Embed from '../../Structures/Embed';

export default class extends Command {
    constructor() {
        super(
            'channel',
            'Get info on a specified channel!',
            [ 'SEND_MESSAGES', 'EMBED_LINKS' ],
            [ 'chan', 'channelinfo' ]
        );
    }

    async init(message: Message, args: string[]): Promise<Message> {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        }

        return message.channel.send(await this.formatEmbed(message, args.shift()));
    }

    async formatEmbed(message: Message, id: string): Promise<MessageEmbed> {
        const icon = message.client.user.avatarURL() ?? message.client.user.defaultAvatarURL;
        let channel: TextChannel;
        if(id && message.mentions.channels.size === 0) {
            try {
                channel = await message.client.channels.fetch(id) as TextChannel;
            } catch {
                return Embed.fail('The channel ID provided is invalid!');    
            }
        } else if(message.mentions.channels.size > 0) {
            channel = await message.client.channels.fetch(message.mentions.channels.first().id) as TextChannel;
        } else {
            channel = message.channel as TextChannel;
        }

        const embed = Embed.success()
            .setAuthor(message.client.user.username, icon)
            .setTimestamp()
            .setDescription(`
            ${channel.toString()}
            \`\`${channel.topic?.length ? channel.topic : 'No topic set'}\`\`
            `)
            .addField('**ID:**',         channel.id, true)
            .addField('**Type:**',       channel.type, true)
            .addField('**Name:**',       channel.name, true)
            .addField('**NSFW:**',       channel.nsfw ? 'Yes' : 'No', true)
            .addField('**Parent:**',     channel.parent?.toString?.() ?? 'None', true)
            .addField('**Rate-limit:**', (channel.rateLimitPerUser?.toLocaleString?.() ?? 0) + ' secs', true)
            .addField('**Created:**',    channel.createdAt, true)

        return embed;
    }
}