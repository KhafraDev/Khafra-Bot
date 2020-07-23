import { Command } from '../../Structures/Command';
import { Message, GuildEmojiManager } from 'discord.js';
import Embed from '../../Structures/Embed';
import { formatDate } from '../../Helpers/Date';

export default class extends Command {
    constructor() {
        super(
            'server',
            'Get info about the server!',
            [ /* No extra perms needed */ ],
            5,
            [ 'serverinfo' ]
        );
    }

    init(message: Message) {        
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        }

        return message.channel.send(this.formatEmbed(message));
    }

    formatEmbed(message: Message) {
        const guild = message.guild;
        const icon = message.client.user.displayAvatarURL();

        const embed = Embed.success()
            .setAuthor(message.client.user.username, icon)
            .setTimestamp()
            .setThumbnail(guild.bannerURL())
            .setDescription(`
            *${guild.name}*
            \`\`${guild.description?.length ? guild.description : 'No description set'}\`\`
            `)
            .addField('**ID:**',            guild.id, true)
            .addField('**Large:**',         guild.large ? 'Yes' : 'No', true)
            .addField('**Members:**',       guild.memberCount.toLocaleString(), true)
            .addField('**Owner:**',         guild.owner.toString(), true)
            .addField('**Boosts:**',        guild.premiumSubscriptionCount.toLocaleString(), true)
            .addField('**Tier:**',          guild.premiumTier, true)
            .addField('**Region:**',        guild.region, true)
            .addField('**Vanity URL:**',    guild.vanityURLCode ? `discord.gg/${guild.vanityURLCode}` : 'None', true)
            .addField('**Verification:**',  guild.verificationLevel, true)
            .addField('**Joined:**',        formatDate('MMMM Do, YYYY kk:mm:ssA', guild.createdAt), false)

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