import { Command } from "../../../Structures/Command.js";
import { Message } from "discord.js";
import twemoji from "twemoji-parser"; // cjs module

export default class extends Command {
    constructor() {
        super(
            [
                'Enlarge an emoji!',
                '🦸 🤠', '🥙', '<:Jack:579367928722489346>'
            ],
            [ 'ATTACH_FILES' ],
            {
                name: 'emoji',
                folder: 'Fun',
                args: [1, 5]
            }
        );
    }

    init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(this.Embed.missing_perms());
        }

        const guildEmojis   = args.slice(0, 5).join(' ').match(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/g) ?? [];
        const unicodeEmojis = args.slice(0, 5).join(' ').replace(/<?(a)?:?(\w{2,32}):(\d{17,19})>?/g, '');

        const unicodeParsed = twemoji.parse(unicodeEmojis, {
            assetType: 'png'
        }).map(({ url }) => url);
        
        const guildParsed = guildEmojis
            .map(e => e.match(/\d{17,19}/).shift())
            .map(id => message.guild.emojis.cache.get(id) ?? message.client.emojis.cache.get(id))
            .filter(Boolean)
            .map(e => e.url);

        if(unicodeParsed.length === 0 && guildParsed.length === 0) {
            return message.channel.send(this.Embed.fail('No guild or unicode emojis provided!'));
        }

        return message.channel.send([...unicodeParsed, ...guildParsed].join('\n'));
    }
}