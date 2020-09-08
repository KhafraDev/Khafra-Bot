import { Command } from "../../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../../Structures/Embed";

export default class extends Command {
    constructor() {
        super(
            [
                'TriviaHelp: get help with trivia commands!',
                ''
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'triviahelp',
                folder: 'Trivia',
                args: [0, 0]
            }
        );
    }

    init(message: Message) {
        const embed = Embed.success()
            .setTitle('Trivia')
            .setDescription(`
            For trivia categories try the \`\`trivialist\`\` command.
            To start a game, use the \`\`trivia\`\` command. It takes a few arguments:
            \`\`category number\`\`, \`\`difficulty\`\`, and \`\`number of questions\`\`

            For all trivia commands try the list command: \`\`list trivia\`\`!
            `);

        return message.channel.send(embed);
    }
}