import { Command } from "../../../Structures/Command.js";
import { Message } from "discord.js";

import { GuardianResponse } from "../../../lib/Backend/Guardian/types/Guardian";
import { guardian } from "../../../lib/Backend/Guardian/Guardian.js";

export default class extends Command {
    constructor() {
        super(
            [
                'TheGuardian: search for articles dating back to 1999!',
                '2008-01-01 obama presidency',
                'trump presidency'
            ],
			{
                name: 'theguardian',
                folder: 'News',
                args: [1],
                aliases: [ 'guardian' ]
            }
        );
    }

    async init(message: Message, args: string[]) {
        let res: GuardianResponse;
        try {
            res = await guardian(args, new Date(args[0]));
        } catch {
            return message.reply(this.Embed.fail('An unexpected error occurred!'));
        }

        let desc = '';
        for(const article of res.response.results) {
            const line = `[${article.webTitle}](${article.webUrl}) - ${article.pillarName}\n`;
            if(desc.length + line.length > 2048) {
                break;
            }
            desc += line;
        }

        const embed = this.Embed.success()
            .setFooter('© 2020 Guardian News & Media Limited or its affiliated companies.')
            .setDescription(desc)
            .setTitle('Results')

        return message.reply(embed);
    }
}