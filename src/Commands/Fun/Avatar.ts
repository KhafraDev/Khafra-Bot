import { Command } from '../../Structures/Command.js';
import { Message } from 'discord.js';
import { getMentions } from '../../lib/Utility/Mentions.js';
import { RegisterCommand } from '../../Structures/Decorator.js';

@RegisterCommand
export class kCommand extends Command {
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
        const user = await getMentions(message, 'users') ?? message.author;

        const avatar = user.displayAvatarURL({
            size: 512,
            format: 'png',
            dynamic: true
        });
        
        return this.Embed.success(`${user}'s avatar`).setImage(avatar);
    }
}