import { Command } from '../../Structures/Command.js';
import { Message, User, TextChannel, Permissions } from 'discord.js';
import { GuildSettings } from '../../lib/types/Collections.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Unban a user from the guild.',
                '1234567891234567 for apologizing',
                '9876543217654321'
            ],
			{
                name: 'unban',
                folder: 'Moderation',
                args: [1],
                guildOnly: true,
                permissions: [ Permissions.FLAGS.BAN_MEMBERS ]
            }
        );
    }

    async init(message: Message, args: string[], settings: GuildSettings) {
        const [id, ...reason] = args.length > 1 ? args : [args].flat();
        let user: User;
        try {
            user = await message.client.users.fetch(id);
            await message.guild.members.unban(user, reason?.join(' '));
        } catch(e) {
            console.log(e);
            return message.reply(this.Embed.fail('Invalid User!'));
        }

        await message.reply(this.Embed.success(`
        **Successfully** unbanned ${user}${reason.join(' ').length ? ' for \`\`' + reason.join(' ') + '\`\`' : ''}!
        `));

        if(typeof settings?.modActionLogChannel === 'string') {
            const channel = message.guild.channels.cache.get(settings.modActionLogChannel) as TextChannel;
            if(channel?.type !== 'text') {
                return;
            } else if(!channel.permissionsFor(message.guild.me).has([ 'SEND_MESSAGES', 'EMBED_LINKS' ])) {
                return;
            }

            return channel.send(this.Embed.success(`
            **Offender:** ${user}
            **Reason:** ${reason?.join(' ') ?? 'No reason given.'}
            **Staff:** ${message.member}
            `).setTitle('Member Unbanned'));
        }
    }
}