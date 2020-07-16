import Command from '../../Structures/Command';
import { Message, MessageEmbed, GuildEmojiManager } from 'discord.js';

export default class extends Command {
    constructor() {
        super(
            'server',
            'Get info about the server!',
            [ 'SEND_MESSAGES', 'EMBED_LINKS' ]
        );
    }

    init(message: Message): Promise<Message> {        
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.failEmbed(`
            One of us doesn't have the needed permissions!

            Both of us must have \`\`${this.permissions.join(', ')}\`\` permissions to use this command!
            `));
        }

        return message.channel.send(this.formatEmbed(message));
    }

    formatEmbed(message: Message): MessageEmbed {
        const guild = message.guild;
        const icon = message.client.user.avatarURL() ?? message.client.user.defaultAvatarURL;

        const embed = new MessageEmbed()
            .setAuthor(message.client.user.username, icon)
            .setTimestamp()
            .setThumbnail(guild.bannerURL())
            .setDescription(`
            *${guild.name}*
            \`\`${guild.description ?? 'No description set'}\`\`
            `)
            .addField('**ID:**', guild.id, true)
            .addField('**Large:**', guild.large ? 'Yes' : 'No', true)
            .addField('**Members:**', guild.memberCount.toLocaleString(), true)
            .addField('**Owner:**', guild.owner.toString(), true)
            .addField('**Boosts:**', guild.premiumSubscriptionCount.toLocaleString(), true)
            .addField('**Tier:**', guild.premiumTier, true)
            .addField('**Region:**', guild.region, true)
            .addField('**Vanity URL:**', guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : 'None', true)
            .addField('**Verification:**', guild.verificationLevel, true)

        for(const e of this.formatEmojis(guild.emojis)) {
            embed.addField('Emoji', e);
        }

        return embed;
    }

    /**
     * Formats Emojis into separate arrays of strings that can be used in a field.
     * Max fields: 5, so we don't go over the limit (hopefully!)
     * @param emojis Emoji collection
     */
    formatEmojis(emojis: GuildEmojiManager): string[] {
        const emotes = [];
        let idx = 0;

        for(const [id, emoji] of emojis.cache) {
            const e = `<:${emoji.name}:${id}>`;
            if(emotes[idx] && emotes[idx].length + e.length > 1024) {
                idx++;
            }
            emotes[idx] ? emotes[idx] += e : (emotes[idx] = e);
        }

        if(!emotes) {
            return ['No emojis cached!'];
        }
        
        const final = [];
        emotes.forEach(e => final.length < 5 ? final.push(e) : null)
        return final;
    }
}