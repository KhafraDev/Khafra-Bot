import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { isValidNumber } from '../../lib/Utility/Valid/Number.js';
import ms from 'ms';
import { validSnowflake, getMentions } from '../../lib/Utility/Mentions.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Softban a member (bans and instantly unbans them, clearing recent messages).',
                '@user for a good reason',
                '@user bye!',
                '239566240987742220'
            ],
            [ 'BAN_MEMBERS' ],
            {
                name: 'softban', 
                folder: 'Moderation',
                aliases: [ 'softbna' ],
                args: [1],
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        const idOrUser = getMentions(message, args);
        if(!idOrUser) {
            return message.channel.send(this.Embed.generic('Invalid member ID!'))
        } else if(typeof idOrUser === 'string') {
            if(!validSnowflake(idOrUser) || !idOrUser) {
                return message.channel.send(this.Embed.generic('Invalid user ID!'));
            }
        } else {
            const member = message.guild.member(idOrUser);
            if(member && !member.bannable) {
                return message.channel.send(this.Embed.fail(`:( ${idOrUser} isn't bannable!`));
            }
        }

        const clear = typeof args[1] === 'string' ? Math.ceil(ms(args[1]) / 86400000) : 7;

        const msg = await message.channel.send(this.Embed.success(`
        Are you sure you want to ban ${idOrUser}?

        Answer "\`\`yes\`\`" to ban and "\`\`no\`\`" to cancel.
        `));

        if(!msg) {
            return;
        }

        const filter = (m: Message) => 
            m.author.id === message.author.id &&
            ['yes', 'no', 'y', 'n', 'cancel', 'stop'].includes(m.content?.toLowerCase());

        const m = await message.channel.awaitMessages(filter, {
            max: 1,
            time: 20000
        });

        if(m.size === 0) {
            return msg.edit(this.Embed.fail(`Didn't get confirmation to ban ${idOrUser}!`));
        } else if(['no', 'n', 'cancel', 'stop'].includes(m.first()?.content?.toLowerCase())) {
            return msg.edit(this.Embed.fail('Command was canceled!'));
        }

        try {
            await message.guild.members.ban(idOrUser, {
                days: isValidNumber(clear) ? clear : 7,
                reason: args.slice(args[1] && ms(args[1]) ? 2 : 1).join(' ')
            });
            await message.guild.members.unban(idOrUser, `Khafra-Bot: softban by ${message.author.tag} (${message.author.id})`);
        } catch {
            return message.channel.send(this.Embed.fail(`${idOrUser} isn't bannable!`));
        }

        return message.channel.send(this.Embed.success(`
        ${idOrUser} has been soft-banned from the guild!
        `));
    }
}