import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import Embed from "../../Structures/Embed";

const start = `
 ________________________________________
`

/**
 * DO NOT TOUCH!
 * YOU WILL BREAK SOMETHING.
 */
const end = { 
    default: `
 ----------------------------------------
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
`,
    tux: `
 -----------------------------------------
    \\
     \\
         .--.
        |o_o |
        |:_/ |
       //   \\ \\
      (|     | )
     /'\\_   _/\`\\
     \\___)=(___/
`,
    'head-in': `
 -----------------------------------------
    \\
     \\
    ^__^         /
    (oo)\\_______/  _________
    (__)\\       )=(  ____|_ \\_____
        ||----w |  \\ \\     \\_____ |
        ||     ||   ||           ||    
`
};

export default class extends Command {
    constructor() {
        super(
            'cowsay',
            [
                'The classic CowSay command for Discord!',
                'head-in Help, I\'m stuck!', 'tux Global warming is a hoax', 'just your ordinary cow.'
            ],
            [ /* No extra perms needed */ ],
            5
        );
    }

    init(message: Message, args: string[]) {
        if(!super.hasPermissions(message)) {
            return message.channel.send(Embed.missing_perms(this.permissions));
        }

        const sentence = ['tux', 'head-in'].includes(args[0]?.toLowerCase?.()) ? args.slice(1).join(' ') : args.join(' ');

        const split = (
            args.length === 0 
                ? 'You must not have much to say. If you want Tux, use !cowsay tux ... or !cowsay head-in ... for something else.' 
                : sentence
            )
            .match(/.{1,38}/g)                                              // split every 38 characters, not on A-z or 0-9 chars.
            .map((value, index, arr) => {
                if(index === 0) {                                           // first item in array
                    return '/ ' + value.trim().padEnd(38, ' ') + ' \\';
                } else if(index === arr.length - 1) {                       // last item in array
                    return '\\ ' + value.trim().padEnd(38, ' ') + ' /';
                }                                                     
                return '| ' + value.trim().padEnd(38, ' ') + ' |';          // all others
            });

        if(split.length === 1) {
            split.push('\\ ' + ''.padEnd(38, ' ') + ' /');
        }

        const formatted = `\`\`\`${start}${split.join('\n')}${end[args.shift()?.toLowerCase?.()] ?? end.default}\`\`\``;
        if(formatted.length > 2048) {
            return message.channel.send(Embed.fail('Cowsay message is too long!'));
        }

        return message.channel.send(formatted);
    }
}