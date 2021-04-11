import { Command, Arguments } from '../../../Structures/Command.js';
import { 
    Message, 
    Permissions, 
    TextChannel
} from 'discord.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isText } from '../../../lib/types/Discord.js.js';
import { hasPerms } from '../../../lib/Utility/Permissions.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';
import { delay } from '../../../lib/Utility/Constants/OneLiners.js';

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Set the rules to the server.'
            ],
			{
                name: 'post',
                aliases: [ 'postrules', 'postrule' ],
                folder: 'Rules',
                args: [0, 0],
                guildOnly: true
            }
        );
    }

    async init(message: Message, _args: Arguments, settings: GuildSettings) {
        if (!hasPerms(message.channel, message.member, Permissions.FLAGS.ADMINISTRATOR)) {
            return this.Embed.missing_perms(true);
        } else if (!settings || !('rules' in settings) || !settings.rules.rules?.length) {
            return this.Embed.fail(`
            Guild has no rules.

            Use the \`\`rules\`\` command to get started!
            `);
        }

        const channel = message.guild.channels.cache.get(settings.rules.channel) as TextChannel;
        if (!channel || !isText(channel)) {
            return this.Embed.fail(`Channel ${channel ?? settings.rules.channel} is invalid!`);
        } else if (!hasPerms(channel, message.guild.me, ['EMBED_LINKS', 'SEND_MESSAGES'])) {
            return this.Embed.fail(`Missing permissions to either use embeds or send messages!`);
        }

        await message.reply(this.Embed.success(`
        Posting ${settings.rules.rules.length} rules in intervals of 5 seconds.
        `));

        for (const rule of settings.rules.rules) {
            await channel.send(this.Embed.success(`
            ${rule.rule}
            `).setTitle(`Rule ${rule.index}`));
            await delay(5000);
        }
    }
}