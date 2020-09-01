import { Command } from "../../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../../Structures/Embed";
import { GuardianResponse } from "../../../lib/Backend/Guardian/types/Guardian";
import { guardian } from "../../../lib/Backend/Guardian/Guardian";

export default class extends Command {
    constructor() {
        super(
            [
                'TheGuardian: search for articles dating back to 1999!',
                '2008-01-01 obama presidency',
                'trump presidency'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'theguardian',
                folder: 'News',
                cooldown: 10,
                aliases: [ 'guardian' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length === 0) {
            return message.channel.send(Embed.missing_args.call(this, 1));
        }

        let res: GuardianResponse;
        try {
            res = await guardian(args, new Date(args[0]));
        } catch {
            return message.channel.send(Embed.fail('An unexpected error occurred!'));
        }

        let desc = '';
        for(const article of res.response.results) {
            const line = `[${article.webTitle}](${article.webUrl}) - ${article.pillarName}\n`;
            if(desc.length + line.length > 2048) {
                break;
            }
            desc += line;
        }

        const embed = Embed.success()
            .setFooter('© 2020 Guardian News & Media Limited or its affiliated companies.')
            .setDescription(desc)
            .setTitle('Results')

        return message.channel.send(embed);
    }
}