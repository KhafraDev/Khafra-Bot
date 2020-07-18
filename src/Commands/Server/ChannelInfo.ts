import Command from '../../Structures/Command';
import { Message, MessageEmbed, Channel, TextChannel } from 'discord.js';

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
            return message.channel.send(this.failEmbed(`
            One of us doesn't have the needed permissions!

            Both of us must have \`\`${this.permissions.join(', ')}\`\` permissions to use this command!
            `));
        }

        return message.channel.send(await this.formatEmbed(message, args.shift()));
    }

    async formatEmbed(message: Message, id: string): Promise<MessageEmbed> {
        const icon = message.client.user.avatarURL() ?? message.client.user.defaultAvatarURL;
        let channel: Channel;
        if(id && message.mentions.channels.size === 0) {
            try {
                channel = await message.client.channels.fetch(id);
            } catch {
                return this.failEmbed('The channel ID provided is invalid!');    
            }
        } else if(message.mentions.channels.size > 0) {
            channel = await message.client.channels.fetch(message.mentions.channels.first().id);
        } else {
            channel = message.channel;
        }

        const chnl = channel as TextChannel;
        const embed = new MessageEmbed()
            .setAuthor(message.client.user.username, icon)
            .setTimestamp()
            .setDescription(`
            ${chnl.toString()}
            \`\`${chnl.topic ?? 'No topic set'}\`\`
            `)
            .addField('**ID:**',         chnl.id, true)
            .addField('**Type:**',       chnl.type, true)
            .addField('**Name:**',       chnl.name, true)
            .addField('**NSFW:**',       chnl.nsfw ? 'Yes' : 'No', true)
            .addField('**Parent:**',     chnl.parent.toString(), true)
            .addField('**Rate-limit:**', chnl.rateLimitPerUser.toLocaleString() + ' secs', true)
            .addField('**Created:**',    chnl.createdAt, true)

        return embed;
    }
}