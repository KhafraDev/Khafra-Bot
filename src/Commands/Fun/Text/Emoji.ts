import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { parse } from 'twemoji-parser';

const GUILD_EMOJI_REG = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/;

export default class extends Command {
    constructor() {
        super(
            [
                'Enlarge an emoji!',
                '🦸 🤠', '🥙', '<:Jack:579367928722489346>'
            ],
			{
                name: 'emoji',
                folder: 'Fun',
                args: [1, 5],
                permissions: [ Permissions.FLAGS.ATTACH_FILES ]
            }
        );
    }

    async init(message: Message) {
        const emojis: string[] = [];

        // unicode emojis
        const p = parse(message.content, { assetType: 'png' });

        for(const emoji of p.reverse()) {
            message.content = message.content.slice(0, emoji.indices[0]) + message.content.slice(emoji.indices[1]);
            message.content = message.content.trim();
            emojis.push(emoji.url);
        }

        // custom emojis
        const m = message.content.split(/\s+/g)
            .filter(e => GUILD_EMOJI_REG.test(e))
            .map(e => e.match(GUILD_EMOJI_REG).slice(3).shift());

        for(const guildEmoji of m) {
            const e = message.guild.emojis.resolve(guildEmoji)?.url;
            if(!e) continue;

            emojis.push(e);
        }

        if(emojis.length === 0) {
            return message.reply(this.Embed.fail('No emojis found in text.'));
        }

        return message.reply(emojis.slice(0, 5).join('\n'));
    }
}