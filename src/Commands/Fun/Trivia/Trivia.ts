import { Command } from "../../../Structures/Command";
import { Message, GuildMember } from "discord.js";
import Embed from "../../../Structures/Embed";
import { trivia } from "../../../lib/Backend/Trivia/Trivia";

const shuffle = (a: string[]) => {
    for(let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const unbase64 = (base64: string) => {
    return Buffer.from(base64, 'base64').toString();
}

export default class extends Command {
    constructor() {
        super(
            [
                'Trivia: start a game of trivia! For help, use the ``triviahelp`` command.',
                '23 hard 5'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'trivia',
                folder: 'Trivia',
                cooldown: 60,
                guildOnly: true
            }
        );
    }

    async init(message: Message, args: string[]) {
        if(args.length < 3) {
            return message.channel.send(Embed.missing_args.call(this, 3));
        }

        const amount = !isNaN(+args[2]) && +args[2] <= 10 ? +args[2] : 10;
        const difficulty = ['easy', 'hard', 'medium'].includes(args[1]) ? args[1] : 'easy';

        const list = await trivia.fetchList();
        if(!list.trivia_categories.some(category => category.id === +args[0])) {
            return message.channel.send(Embed.fail(`
            No category with that ID found! 
            Use the \`\`trivialist\`\` command for valid categories!`
            ));
        }

        const questions = await trivia.fetchQuestions(amount, +args[0], difficulty);
        
        let sent: Message;
        const winners: {
            [key: string]: number
        } = {};

        for(const question of questions.results) {    
            const multiple: string[] = [];
            if(unbase64(question.type) === 'multiple') {
                question.incorrect_answers.forEach(i => multiple.push(unbase64(i)));
                multiple.push(unbase64(question.correct_answer));
            }

            const embed = Embed.success()
                .setTitle(`Question ${questions.results.indexOf(question) + 1}`)
                .setDescription(`
                \`\`${unbase64(question.question)}\`\`
                
                ${multiple.length ? shuffle(multiple).map((v, i) => `[${i + 1}]: \`\`${v}\`\``).join('\n') : ''}
                `);

            if(!sent) {
                sent = await message.channel.send(embed)
            } else if(sent.deleted) { 
                return;
            } else {
                await sent.edit(embed);
            }

            const filter = (m: Message) => m.content?.toLowerCase() === unbase64(question.correct_answer).toLowerCase().trim();
            const collected = await message.channel.awaitMessages(filter, { max: 1, time: 30000 });
            
            if(collected.size === 1) {
                const w = collected.first().member;
                winners[w.id] = winners[w.id] ? winners[w.id] + 1 : 1;
            }
        }

        const winner = Object.entries(winners).sort(([,b], [,d]) => (d as number) - (b as number)).pop();
        const member = winner?.[0] ? await message.guild.members.fetch(winner[0]) : null;

        const end = Embed.success(`${member instanceof GuildMember ? member : 'No one'} guessed ${winner?.[1] ?? 'any'} out of ${amount} questions correct!`)
            .setTitle('The winner is');

        return sent.edit(end);
    }
}