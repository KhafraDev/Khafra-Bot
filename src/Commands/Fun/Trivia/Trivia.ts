import { Command } from "../../../Structures/Command";
import { Message } from "discord.js";
import { trivia } from "../../../lib/Backend/Trivia/Trivia";

const shuffle = <T>(a: T[]): T[] => {
    for(let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const unbase64 = (base64: string) => Buffer.from(base64, 'base64').toString();

export default class extends Command {
    constructor() {
        super(
            [
                'Trivia: start a game of trivia! For help, use the ``triviahelp`` command.',
                '23 hard 5', 'history hard 5', 'entertainment: japanese anime & manga easy 5'
            ],
            [ /* No extra perms needed */ ],
            {
                name: 'trivia',
                folder: 'Trivia',
                guildOnly: true,
                args: [3]
            }
        );
    }

    async init(message: Message, args: string[]) {
        const list = await trivia.fetchList();
        if(!list) {
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }

        const category = args.join(' ').match(trivia.categoryRegex);
        if(category.length === 0) {
            return message.channel.send(this.Embed.fail('Invalid category provided! Use the ``triviacategory`` command!'));
        }

        const [difficulty, q] = args.slice(category[0].split(' ').length);
        if(!difficulty || ['easy', 'medium', 'hard'].indexOf(difficulty.toLowerCase()) === -1) {
            return message.channel.send(this.Embed.fail('Invalid difficulty provided!'));
        }

        if(isNaN(+q)) {
            return message.channel.send(this.Embed.fail('Invalid amount of questions!'));
        }

        const questions = await trivia.fetchQuestions(+q > 10 ? 10 : +q, category[0], difficulty);
        shuffle(questions.results); // modifies original array
        
        let sent: Message;
        const winner: { [key: string]: number } = {};

        for(const question of questions.results) {
            if(!super.hasPermissions(message)) {
                return;
            }

            const answers = shuffle(question.incorrect_answers.concat(question.correct_answer)); // answers.indexOf(correct answer)
            const embed = this.Embed.success()
                .setTitle(`Question ${questions.results.indexOf(question) + 1}`)
                .setDescription(`
                \`\`${unbase64(question.question)}\`\`
                
                ${answers.map((a, i) => `\`\`${i + 1}\`\`: ${unbase64(a)}`).join('\n')}
                `);
            
            if(!sent || sent.deleted || !sent.editable) {
                sent = await message.channel.send(embed);
            } else if(sent instanceof Message) {
                await sent.edit(embed);
            }

            const filter = (m: Message) => m.content?.toLowerCase() === unbase64(question.correct_answer).toLowerCase().trim()
                                           || +m.content === answers.indexOf(question.correct_answer) + 1
            const collected = await message.channel.awaitMessages(filter, { max: 1, time: 30000 });

            if(collected.size === 1) {
                const guesser = collected.first().member;
                winner[guesser.id] = winner[guesser.id] ? winner[guesser.id] + 1 : 1;
            }
        }

        const w = Object.entries(winner).sort((a, b) => b[1] - a[1]).shift();
        const user = w[1] === 0 ? null : await message.client.users.fetch(w[0]);

        if(sent.deleted || !sent.editable) {
            return message.channel.send(this.Embed.success(`${user ?? 'No one'} won with ${w[1]} correct answers.`));
        }

        return sent.edit(this.Embed.success(`${user ?? 'No one'} won with ${w[1]} correct answers.`));
    }
}