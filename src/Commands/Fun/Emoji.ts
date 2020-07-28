import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";
import { parse } from "twemoji-parser";

export default class extends Command {
    constructor() {
        super(
            'emoji',
            [
                'Enlarge an emoji!',
                '🦸 🤠', '🥙'
            ],
            [ 'ATTACH_FILES' ],
            5
        );
    }

    init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        } else if(args.length < 1) {
            return message.channel.send(Embed.missing_args(1, this.name, this.help.slice(1)));
        }

        const parsed = parse(args.join(' '), {
            assetType: 'png'
        }).map(({ url }) => url).slice(0, 5);

        return message.channel.send(parsed.join('\n'));
    }
}