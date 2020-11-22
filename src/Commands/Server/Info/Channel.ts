import { Command } from '../../../Structures/Command.js';
import { 
    Message, 
    Channel, 
    TextChannel, 
    NewsChannel, 
    VoiceChannel, 
} from 'discord.js';
import { getMentions, validSnowflake } from '../../../lib/Utility/Mentions.js';
import { formatDate } from '../../../lib/Utility/Date.js';

// TypeScript is based
const isText = <T extends Channel>(c: T): c is T & (TextChannel | NewsChannel) => c.type === 'text' || c.type === 'news';
const isVoice = <T extends Channel>(c: T): c is T & VoiceChannel => c.type === 'voice';

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
                args: [0, 1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        let idOrChannel = getMentions(message, args, { type: 'channels' });
        if(!idOrChannel || (typeof idOrChannel === 'string' && !validSnowflake(idOrChannel))) {
            idOrChannel = message.channel; 
        }

        const channel = message.guild.channels.resolve(idOrChannel);
        if(!channel) {
            this.logger.log(`Channel: ${channel}, ID: ${idOrChannel}`);
            return message.reply(this.Embed.fail(`
            Channel isn't fetched or the ID is incorrect.
            `));
        }

        const embed = this.Embed.success()
            .addFields(
                { name: '**ID:**', value: channel.id, inline: true },
                { name: '**Type:**', value: channel.type, inline: true }
            )
            .setFooter(`Created ${formatDate('MMM. Do, YYYY hh:mm:ssA t', channel.createdTimestamp)}`);

        if(isText(channel)) {
                embed
                .setDescription(`
                ${channel}
                ${channel.topic ? `\`\`\`${channel.topic}\`\`\`` : ''}
                `)
                .addFields(
                    { name: '**Name:**', value: channel.name, inline: true },
                    { name: '**Parent:**', value: channel.parent ?? 'None', inline: true },
                    { name: '**NSFW:**', value: channel.nsfw ? 'Yes' : 'No', inline: true },
                    { name: '**Position:**', value: channel.position, inline: true },
                );

                if(channel instanceof TextChannel) {
                    embed.addField('**Rate-Limit:**', channel.rateLimitPerUser + ' seconds', true);
                }
        } else if(isVoice(channel)) {
            embed
            .addField('**Bitrate:**',   channel.bitrate.toLocaleString(), true)
            .addField('**Full:**',      channel.full ? 'Yes' : 'No', true)
            .addField('**Max Users:**', channel.userLimit === 0 ? 'Unlimited' : channel.userLimit, true)
        }

        return message.reply(embed);
    }
}