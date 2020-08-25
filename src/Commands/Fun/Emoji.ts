import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { parse } from "twemoji-parser";

export default class extends Command {
    constructor() {
        super(
            [
                'Enlarge an emoji!',
                '🦸 🤠', '🥙'
            ],
            [ 'ATTACH_FILES' ],
            {
                name: 'emoji',
                folder: 'Fun',
                cooldown: 5
            }
        );
    }

    init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms.call(this));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        const parsed = parse(args.join(' '), {
            assetType: 'png'
        }).map(({ url }) => url).slice(0, 5);

        return message.channel.send(parsed.join('\n'));
    }
}