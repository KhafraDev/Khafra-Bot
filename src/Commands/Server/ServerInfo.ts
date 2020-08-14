import { Command } from '../../Structures/Command';
import { Message, GuildEmojiManager } from 'discord.js';
import Embed from '../../Structures/Embed';
import { formatDate } from '../../lib/Utility/Date';

export default class extends Command {
    constructor() {
        super(
            { name: 'server', folder: 'Server' },
            [
                'Get info about the server!',
                ''
            ],
            [ /* No extra perms needed */ ],
            5,
            [ 'serverinfo', 'guild', 'guildinfo' ]
        );
    }

    init(message: Message) {        
        const embed = Embed.success()
            .setAuthor(message.client.user.username, message.client.user.displayAvatarURL())
            .setTimestamp()
            .setThumbnail(message.guild.bannerURL())
            .setDescription(`
            *${message.guild.name}*
            \`\`${message.guild.description?.length ? message.guild.description : 'No description set'}\`\`
            `)
            .addField('**ID:**',            message.guild.id, true)
            .addField('**Large:**',         message.guild.large ? 'Yes' : 'No', true)
            .addField('**Members:**',       message.guild.memberCount.toLocaleString(), true)
            .addField('**Owner:**',         message.guild.owner.toString(), true)
            .addField('**Boosts:**',        message.guild.premiumSubscriptionCount.toLocaleString(), true)
            .addField('**Tier:**',          message.guild.premiumTier, true)
            .addField('**Region:**',        message.guild.region, true)
            .addField('**Vanity URL:**',    message.guild.vanityURLCode ? `discord.gg/${message.guild.vanityURLCode}` : 'None', true)
            .addField('**Verification:**',  message.guild.verificationLevel, true)
            .addField('**Created:**',        formatDate('MMMM Do, YYYY hh:mm:ss A t', message.guild.createdAt), false)
            .addFields(this.formatEmojis(message.guild.emojis).map(e => ({
                name: 'Emoji',
                value: e,
                inline: true
            })));

        return message.channel.send(embed);
    }

    /**
     * Formats Emojis into separate arrays of strings that can be used in a field.
     * Max fields: 5, so we don't go over the limit (hopefully!)
     * @param emojis Emoji collection
     */
    formatEmojis(emojis: GuildEmojiManager) {
        const emotes: string[] = [];
        let idx = 0;

        for(const [id, emoji] of emojis.cache) {
            const e = `<:${emoji.name}:${id}>`;
            if(emotes[idx] && emotes[idx].length + e.length > 1024) {
                idx++;
            }
            emotes[idx] ? emotes[idx] += e : (emotes[idx] = e);
        }

        if(emotes.length) {
            return ['No emojis cached!'];
        }
        
        return emotes.slice(0, 5);
    }
}