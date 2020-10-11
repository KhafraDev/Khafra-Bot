import { Command } from "../../Structures/Command";
import { Message } from "discord.js";
import { TicTacToe } from "../../lib/Backend/TicTacToe";
import { isValidNumber } from "../../lib/Utility/Valid/Number";

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
                args: [0, 1]
            }
        );
    }
    
    async init(message: Message, args: string[]) {
        const opponent = args.length === 0
            ? null 
            : message.mentions.members.first();

        if(opponent?.user.bot && opponent?.id !== message.guild?.me.id) {
            return message.channel.send(this.Embed.fail('You can\'t play against another bot!'));
        }

        const g = new TicTacToe(); // game
        const m = await message.channel.send(this.Embed.success(`
        \`\`\`${g.format()}\`\`\`
        `)); // message to edit
        if(!m) {
            return;
        }

        const f = (msg: Message) => 
            (msg.author.id === message.author.id || msg.author.id === opponent?.id)
            && isValidNumber(+msg.content) && +msg.content > 0 && +msg.content <= 9;

        const c = message.channel.createMessageCollector(f, { time: 120000 });

        c.on('collect', (collected: Message) => {
            const validTurn = (collected.author.id === message.author.id && g.turn === 'X') // author's message, and turn is X
                              || (collected.author.id === opponent?.id && g.turn === 'O');  // opponent's message, turn is O

            if(!validTurn) {
                return;
            }

            const playerTurn = g.go(+collected.content);
            if(!playerTurn) { // valid turn
                if(!opponent) { // no opponent, so have bot go
                    const botTurn = g.go(); // bot goes
                    if(!botTurn) { // valid bot turn
                        return m.edit(this.Embed.success(`
                        \`\`\`${g.format()}\`\`\`
                        `));
                    } else { // something went wrong, or the bot won
                        const embed = 'winner' in botTurn
                            ? this.Embed.success(`\`\`\`${g.format()}\`\`\``)
                            : this.Embed.fail(`\`\`\`${g.format()}\`\`\``);
                        embed.setTitle('winner' in botTurn ? botTurn.winner + ' won!' : botTurn.error);
                        
                        if('winner' in botTurn) {
                            c.stop();
                        }

                        return m.edit(embed);
                    }
                } else {
                    return m.edit(this.Embed.success(`
                    \`\`\`${g.format()}\`\`\`
                    `));
                }
            } else {
                const embed = 'winner' in playerTurn
                    ? this.Embed.success(`\`\`\`${g.format()}\`\`\``)
                    : this.Embed.fail(`\`\`\`${g.format()}\`\`\``);
                embed.setTitle('winner' in playerTurn ? playerTurn.winner + ' won!' : playerTurn.error);
                
                if('winner' in playerTurn) {
                    c.stop();
                }

                return m.edit(embed);
            }
        });
    }
}