import { Command } from '../../../Structures/Command.js';
import { Message, Permissions } from 'discord.js';
import { parse } from 'twemoji-parser';
import { RegisterCommand } from '../../../Structures/Decorator.js';

const GUILD_EMOJI_REG = /<?(a)?:?(\w{2,32}):(\d{17,19})>?/g;

@RegisterCommand
export class kCommand extends Command {
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
        const unicode = parse(message.content, { assetType: 'png' })
            .map(e => e.url);

        const guild = [...message.content.matchAll(GUILD_EMOJI_REG)]
            .filter(e => message.guild.emojis.cache.has(e[3]))
            .map(e => message.guild.emojis.resolve(e[3]).url);

        const all =  [...unicode, ...guild];

        if (all.length === 0)
            return this.Embed.fail(`No guild or unicode emojis were in the message! 😕`);

        return all.join('\n');
    }
}