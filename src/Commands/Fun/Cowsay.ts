import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { readFile } from 'fs/promises';
import { join } from "path";

const dir = join(process.cwd(), 'assets/Cowsay');
const start = `
 ________________________________________
`;

export default class extends Command {
    constructor() {
        super(
            [
                'The classic CowSay command for Discord!',
                'head-in Help, I\'m stuck!', 'tux Global warming is a hoax', 'just your ordinary cow.', 'list'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'cowsay',
                folder: 'Fun',
                args: [1]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const types = [
            'beavis',   'bong',   'bud-frogs',   'bunny',   'cheese',
            'cowering', 'cowsay', 'cowth-vader', 'darth-vader-koala',
            'demon',    'dragon', 'dragon-and-cow', 'elephant',
            'elephant-in-snake',  'flaming-sheep', 'ghostbusters',
            'head-in', 'hello-kitty', 'kiss', 'kitty', 'koala',
            'luke-skywalker-koala', 'mech-and-cow', 'meow', 'milk',
            'moofasa', 'mutilated', 'ren', 'satanic', 'scowleton', 
            'sheep', 'small-cow', 'sodomized', 'squirrel', 'stegosaurus',
            'stimpy', 'super-milker', 'surgery', 'turkey', 'turtle',
            'tux', 'www'
        ];

        if(args[0].toLowerCase() === 'list') {
            return message.channel.send(this.Embed.success(`
            ${types.map(t => '``' + t + '``').join(', ')}
            `));
        }

        const sentence = types.includes(args[0].toLowerCase()) ? args.slice(1).join(' ') : args.join(' ');

        const split = sentence
            .match(/.{1,38}/g)                                              // split every 38 characters
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

        const i = types.includes(args[0].toLowerCase()) ? args[0].toLowerCase() : 'cowsay';
        const data = await readFile(join(dir, `${i}.txt`), {
            encoding: 'utf-8'
        });
            
        const formatted = `\`\`\`${start}${split.join('\n')}\n${data}\`\`\``;
        if(formatted.length > 2048) {
            return message.channel.send(this.Embed.fail('Cowsay message is too long!'));
        }

        return message.channel.send(formatted);
    }
}