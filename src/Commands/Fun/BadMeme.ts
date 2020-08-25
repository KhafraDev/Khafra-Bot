import { Command } from "../../Structures/Command";
import { Message, TextChannel } from "discord.js";
import { reddit } from "../../lib/Backend/BadMeme/BadMeme";
import Embed from "../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            [
                'Get a bad meme! Idea from NotSoBot.',
                'thesimppolice', ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'badmeme',
                folder: 'Fun',
                cooldown: 5
            }
        );
    }

    async init(message: Message, args: string[]) {
        const res = await reddit(args[0], (message.channel as TextChannel).nsfw);
        if(!res) {
            return message.channel.send(Embed.fail(`
            No images found! NSFW images will only work if the channel is marked \`\`nsfw\`\`!
            `));
        } else if('error' in res) {
            return message.channel.send(Embed.fail(`
            ${res.error}: ${res.message}
            `));
        } else if('status' in res) {
            return message.channel.send(Embed.fail(`
            Received status code ${res.status} (${res.statusText})!
            `));
        }

        const embed = Embed.success()
            .setImage(res.data.url);

        return message.channel.send(embed);
    }
}