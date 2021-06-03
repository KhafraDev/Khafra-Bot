import { GuildMember, Message } from 'discord.js';
import { TicTacToe } from '../../../lib/Packages/TicTacToe.js';
import { Embed } from '../../../lib/Utility/Constants/Embeds.js';
import { getMentions } from '../../../lib/Utility/Mentions.js';
import { Arguments, Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

const getEmbed = (game: TicTacToe, [X, Op]: [GuildMember, GuildMember]) => {
    const embed = Embed.success(`
    ${X} vs. ${Op}
    \`\`\`${game}\`\`\`
    `)
    .setTitle('Tic-Tac-Toe');

    if (game.winner())
        return embed.addField('**Winner!**', `${game.turn} won!`);
    else if (game.isFull())
        return embed.addField('**Status:**', 'It\'s a tie!');

    return embed.addField('**Turn:**', `${game.turn === 'X' ? X.user.username : Op.user.username}'s Turn`);
}

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Play a game of Tic-Tac-Toe!'
            ],
			{
                name: 'tictactoe',
                folder: 'Games',
                args: [0, 1],
                ratelimit: 30
            }
        );
    }

    async init(message: Message, { args }: Arguments) {
        const member = args.length === 0 
            ? message.guild.me 
            : await getMentions(message, 'members');
            
        const opponent = member ?? message.guild.me;
        const game = new TicTacToe();

        const m = await message.reply(getEmbed(game, [message.member, opponent]));

        const f = (m: Message) =>
            (game.turn === 'X' ? message.author.id : opponent.id) === m.member.id && // it's the player's turn
            Number(m.content) - 1 in game.board && // valid turn; [0, 8] so we subtract 1
            game.go(Number(m.content) - 1) !== null; // this method returns null when the space is not empty

        const c = message.channel.createMessageCollector(
            f,
            { time: 120000 }
        );

        c.on('collect', (_msg: Message) => {
            if (game.winner()) // stop collecting messages if there's a winner already
                c.stop();
            else if (game.turn === 'O' && opponent.id === message.guild.me.id && !game.isFull()) // bot's turn to go, not real player
                game.botGo();

            return void m.edit(getEmbed(game, [message.member, opponent]));
        });
    }
}