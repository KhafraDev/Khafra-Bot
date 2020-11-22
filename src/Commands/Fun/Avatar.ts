import { Command } from "../../Structures/Command.js";
import { Message, User } from "discord.js";
import { getMentions, validSnowflake } from "../../lib/Utility/Mentions.js";

export default class extends Command {
    constructor() {
        super(
            [
                'Get someone\'s avatar!',
                '', '@Khafra#0001', '267774648622645249'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'avatar',
                folder: 'Fun',
                args: [0, 1]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const idOrUser = getMentions(message, args);
        let user;
        if(!idOrUser || (typeof idOrUser === 'string' && !validSnowflake(idOrUser))) {
            user = message.author;
        } else if(idOrUser instanceof User) {
            user = idOrUser;
        } else {
            try {
                user = await message.client.users.fetch(idOrUser);
            } catch {
                return message.reply(this.Embed.generic('Invalid user ID!'));
            }
        }

        const avatar = user.displayAvatarURL({
            size: 512,
            format: 'png',
            dynamic: true
        });
        
        return message.reply(this.Embed.success(`${user}'s avatar`).setImage(avatar));
    }
}