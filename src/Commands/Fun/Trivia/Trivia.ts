import { Command } from "../../../Structures/Command";
import { Message, GuildMember } from "discord.js";
import { Trivia, categoryRegex, categories } from "../../../lib/Backend/Trivia/Trivia";
import { shuffle } from '../../../lib/Utility/Array';

type diff = 'easy' | 'medium' | 'hard';
const games: { [key: string]: string } = {};

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
        if(message.guild.id in games) {
            return message.channel.send(this.Embed.fail(`A game is already going on in this guild!`));
        }

        const list = await Trivia.fetchList();
        if(!list) {
            return message.channel.send(this.Embed.fail('An unexpected error occurred!'));
        }

        const category = Number.isInteger(+args[0])
            ? categories.filter(d => d.id === +args[0]).shift()?.name
            : args.join(' ').match(categoryRegex)?.shift();
                    
        const cid = category ? categories.filter(e => e.name.toLowerCase() === category.toLowerCase()) : [];
        if(category?.length === 0 || cid.length === 0) {
            return message.channel.send(this.Embed.generic('Invalid category provided! Use the ``triviacategory`` command!'));
        }

        const [difficulty, q] = args.slice(Number.isInteger(+args[0]) ? 1 : category.split(' ').length);
        if(!difficulty || !['easy', 'medium', 'hard'].includes(difficulty.toLowerCase())) {
            return message.channel.send(this.Embed.generic('Invalid difficulty provided!'));
        }

        if(isNaN(+q) || !Number.isInteger(+q)) {
            return message.channel.send(this.Embed.generic('Invalid amount of questions!'));
        }

        const questions = await Trivia.fetchQuestions(+q > 10 ? 10 : +q, cid.shift().id, difficulty as diff);
        
        const guesses: { [key: number]: string[] } = {}
        const winner: { [key: number]: GuildMember } = {};
        let msg: Message = null;
        games[message.guild.id] = message.channel.id;

        for(const question of questions) {
            if(msg?.deleted) {
                delete games[message.guild.id];
                return;
            }
            
            const answers = shuffle([question.correct_answer, ...question.incorrect_answers]);
            const index = questions.indexOf(question);
            const embed = this.Embed.success()
                .setTitle(`${question.category} - ${question.difficulty}`)
                .setDescription(`
                \`\`${question.question}\`\`
                Answers:
                ${answers.map((a, i) => `**${i + 1}:** ${a}`).join('\n')}
                `);

            msg = msg ? await msg.edit(embed) : await message.channel.send(embed);

            const filter = (m: Message) =>  {
                if(guesses[index]?.includes(m.author.id)) {
                    return false;
                }

                guesses[index] ? guesses[index].push(m.author.id) : (guesses[index] = [m.author.id]);
                setTimeout(() => guesses[index].splice(guesses[index].indexOf(m.author.id), 1), 1000);

                return m.content?.toLowerCase() === question.correct_answer.toLowerCase().trim()
                       || +m.content === answers.indexOf(question.correct_answer) + 1
            }

            // If two people type the correct answer at near the same time and two questions have the same correct answer 
            // it instantly skips over the second question. - Pseudo
            await new Promise(r => setTimeout(r, 1000));
            const collector = message.channel.createMessageCollector(filter, {
                time: 30000
            });

            await new Promise(r => {
                collector.on('collect', (m: Message) => {
                    winner[index] = m.member;
                    collector.stop();
                });

                collector.on('end', r);
            });
        }

        delete games[message.guild.id];
        const won = Object.values(winner).sort((a, b) =>
            Object.values(winner).filter(v => v.id === a.id).length - Object.values(winner).filter(v => v.id === b.id).length
        ).pop();

        if(!msg.deleted) {
            return msg.edit(this.Embed.success(`${won ?? 'No one'} won the game!`));
        }
    }
}