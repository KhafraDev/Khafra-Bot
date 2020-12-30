import { Command } from '../../../Structures/Command.js';
import { 
    Message, 
    TextChannel
} from 'discord.js';
import { GuildSettings } from '../../../lib/types/Collections.js';
import { isText } from '../../../lib/types/Discord.js.js';

const delay = (): Promise<void> => new Promise(r => setTimeout(r, 5000));

export default class extends Command {
    constructor() {
        super(
            [
                'Set the rules to the server.',
                ''
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

    async init(message: Message, _: string[], settings: GuildSettings) {
        if(!super.userHasPerms(message, [ 'ADMINISTRATOR' ])
            && !this.isBotOwner(message.author.id)
        ) {
            return message.reply(this.Embed.missing_perms(true));
        } else if(!settings || !('rules' in settings) || !settings.rules.rules?.length) {
            return message.reply(this.Embed.fail(`
            Guild has no rules.

            Use the \`\`rules\`\` command to get started!
            `));
        }

        const channel = message.guild.channels.cache.get(settings.rules.channel) as TextChannel;
        if(!channel || !isText(channel)) {
            return message.reply(this.Embed.fail(`Channel ${channel ?? settings.rules.channel} is invalid!`));
        } else if(!channel.permissionsFor(message.guild.me).has(['EMBED_LINKS', 'SEND_MESSAGES'])) {
            return message.reply(this.Embed.fail(`Missing permissions to either use embeds or send messages!`));
        }

        await message.reply(this.Embed.success(`
        Posting ${settings.rules.rules.length} rules in intervals of 5 seconds.
        `));

        for(const rule of settings.rules.rules) {
            await channel.send(this.Embed.success(`
            ${rule.rule}
            `).setTitle(`Rule ${rule.index}`));
            await delay();
        }
    }
}