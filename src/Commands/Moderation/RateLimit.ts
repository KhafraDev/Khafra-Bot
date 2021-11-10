import { Command, Arguments } from '../../Structures/Command.js';
import { Permissions } from 'discord.js';
import { parseStrToMs } from '../../lib/Utility/ms.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { isExplicitText, isText, Message } from '../../lib/types/Discord.js.js';
import { hasPerms } from '../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { plural } from '../../lib/Utility/String.js';
import { kGuild } from '../../lib/types/KhafraBot.js';
import { Range } from '../../lib/Utility/Valid/Number.js';
import { bold, inlineCode } from '@khaf/builders';
import { dontThrow } from '../../lib/Utility/Don\'tThrow.js';

const MAX_SECS = parseStrToMs('6h')! / 1000;
const inRange = Range({ min: 0, max: MAX_SECS, inclusive: true });

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Sets ratelimit in seconds.',
                '#general 6h',
                '543940496683434014 15s',
                '#general 0',
                '5s'
            ],
			{
                name: 'ratelimit', 
                folder: 'Moderation',
                aliases: [ 'slowmode', 'slow-mode', 'rl' ],
                args: [1, 2],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.MANAGE_CHANNELS ]
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: kGuild) {
        // if the channel is mentioned as the first argument
        const channelFirst = /(<#)?(\d{17,19})>?/g.test(args[0]);
        const guildChannel = channelFirst 
            ? (await getMentions(message, 'channels') ?? message.channel)
            : message.channel;

        // if a channel is mentioned in the first argument, 
        // seconds must be the second argument + vice versa.
        // by default, reset the ratelimit (0s).
        const secs = parseStrToMs((channelFirst ? args[1] : args[0]) ?? '0s')! / 1000;

        if (!inRange(secs))
            return this.Embed.fail(`Invalid number of seconds! ${secs ? `Received ${secs} seconds.` : ''}`);
        // although there are docs for NewsChannel#setRateLimitPerUser, news channels
        // do not have this function. (https://discord.js.org/#/docs/main/master/class/NewsChannel?scrollTo=setRateLimitPerUser)
        if (!isExplicitText(guildChannel))
            return this.Embed.fail('Rate-limits can only be set in text channels!');

        const [rlError] = await dontThrow(guildChannel.setRateLimitPerUser(secs, 
            `Khafra-Bot, req: ${message.author.tag} (${message.author.id})`
        ));

        if (rlError !== null) {
            return this.Embed.fail(`An unexpected error has occurred: ${inlineCode(rlError.message)}`);
        }

        void message.reply({ 
            embeds: [this.Embed.success(`Slow-mode set in ${guildChannel} for ${secs} second${plural(secs)}!`)]
        });

        if (settings.mod_log_channel !== null) {
            const channel = message.guild.channels.cache.get(settings.mod_log_channel);
            
            if (!isText(channel) || !hasPerms(channel, message.guild.me, [ Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS ]))
                return;

            return void channel.send({
                embeds: [
                    this.Embed.success(`
                    ${bold('Channel:')} ${guildChannel} (${guildChannel.id}, ${guildChannel.type}).
                    ${bold('Staff:')} ${message.member}
                    ${bold('Duration:')} ${secs} second${plural(secs)}
                    `).setTitle('Channel Rate-Limited')
                ]
            });
        }
    }
}