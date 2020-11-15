import { Command } from "../../Structures/Command.js";
import { Message } from "discord.js";
import { TicTacToe } from "../../lib/Backend/TicTacToe.js";

const inRange = (num: number, min: number, max: number) => num >= min && num <= max;

export default class extends Command {
    constructor() {
        super(
            [
                'Play a game of TicTacToe!',
                '', '@Khafra#0001'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'tictactoe',
                folder: 'Fun',
                args: [0, 1],
                guildOnly: true
            }
        );
    }
    
    async init(message: Message, args: string[]) {
        const opponent = args.length === 0
            ? message.guild.me
            : message.mentions.members.first();

        if(opponent.user.bot && opponent.id !== message.guild.me.id) {
            return message.channel.send(this.Embed.fail('You can\'t play against another bot!'));
        }

        const g = new TicTacToe(); // game
        const m = await message.channel.send(this.Embed.success(`\`\`\`${g.format()}\`\`\``));
        if(!m) {
            return;
        }

        let i = 0;
        const f = (msg: Message) => 
            (msg.author.id === message.author.id || msg.author.id === opponent.id) &&
            (++i !== 9 || (opponent.user.bot && i !== 5)) && msg.content.length === 1 && inRange(+msg.content, 1, 9);

        const c = message.channel.createMessageCollector(f, { time: 120000 });
        c.on('collect', (collected: Message) => {
            if(g.checkWinner()) {
                c.stop();
            } else if(i === 9 || (opponent.user.bot && i === 5)) {
                c.stop();
            } 

            const validTurn = 
                (collected.author.id === message.author.id && g.turn === 'X') // author's message, and turn is X
                || (collected.author.id === opponent.id && g.turn === 'O');  // opponent's message, turn is O

            if(!validTurn) {
                return;
            }

            const u = g.go(+collected.content);
            if(opponent.user.bot && u && !g.winner) g.go();

            return m.edit(this.Embed.success(`
            ${g.winner ? `${g.turn} has won!` : !u ? 'Can\'t go there!' : ''}
            \`\`\`${g.format()}\`\`\`
            `));
        });
    }
}