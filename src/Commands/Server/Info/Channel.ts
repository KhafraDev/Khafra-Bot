import { Command } from '../../../Structures/Command.js';
import { 
    Message, 
    SnowflakeUtil, 
    TextChannel, 
    NewsChannel, 
    VoiceChannel, 
    Channel 
} from 'discord.js';
import { formatDate } from '../../../lib/Utility/Date.js';

const epoch = new Date('January 1, 2015 GMT-0');
const zeroBinary = ''.padEnd(64, '0');

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
        let id: string;
        if(message.mentions.channels.size > 0) {
            id = message.mentions.channels.first().id;
        } else if(/<?#?\d{17,19}>?/.test(args[0])) {
            id = args[0].match(/<?#?\d{17,19}>?/)[0];
        } else {
            id = message.channel.id;
        }

        const snowflake = SnowflakeUtil.deconstruct(id);
        if( 
            snowflake.date.getTime() === epoch.getTime()
            || snowflake.binary === zeroBinary
            || snowflake.timestamp > Date.now()
            || snowflake.timestamp === epoch.getTime() // just in case
        ) {
            return message.channel.send(this.Embed.generic('Invalid channel ID!'));
        }

        let channel;
        try {
            channel = message.guild.channels.cache.filter(c => c.id === id).first()
                      ?? await message.client.channels.fetch(id);
        } catch {
            return message.channel.send(this.Embed.generic('Invalid channel!'));
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

        return message.channel.send(embed);
    }
}