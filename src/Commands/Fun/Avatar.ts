import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { _getMentions } from '../../lib/Utility/Mentions.js';

export default class extends Command {
    constructor() {
        super(
            [
                'Get someone\'s avatar!',
                '', '@Khafra#0001', '267774648622645249'
            ],
			{
                name: 'avatar',
                folder: 'Fun',
                args: [0, 1]
            }
        );
    }

    async init(message: Message) {
        const user = await _getMentions(message, 'users');
        if (!user) {
            return message.reply(this.Embed.fail('No user mentioned and/or an invalid ❄️ was used!'));
        }

        const avatar = user.displayAvatarURL({
            size: 512,
            format: 'png',
            dynamic: true
        });
        
        return message.reply(this.Embed.success(`${user}'s avatar`).setImage(avatar));
    }
}