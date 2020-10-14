import { Command } from "../../../Structures/Command";
import { Message, GuildMember } from "discord.js";
import { Trivia, categoryRegex, categories } from "../../../lib/Backend/Trivia/Trivia";
import { shuffle } from '../../../lib/Utility/Array';
import { pool } from "../../../Structures/Database/Mongo";
import { decode } from 'entities';
import { isValidNumber } from "../../../lib/Utility/Valid/Number";

const games: Record<string, string> = {};

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

        const category = isValidNumber(+args[0])
            ? categories.filter(d => d.id === +args[0])
            : categories.filter(d => d.name.toLowerCase() === args.join(' ').match(categoryRegex)?.shift().toLowerCase());

        if(!category || category.length === 0) {
            return message.channel.send(this.Embed.generic('No category found! Use the ``trivialist`` command for a valid list!'));
        }

        const [difficulty, q] = args.slice(isValidNumber(+args[0]) ? 1 : category[0].name.split(' ').length);
        if(!['easy', 'medium', 'hard'].includes(difficulty?.toLowerCase())) {
            return message.channel.send(this.Embed.generic('Invalid difficulty provided!'));
        } else if(!Number.isInteger(+q) || +q > 10) {
            return message.channel.send(this.Embed.generic('Invalid amount of questions! Ten questions is the max per game.'));
        }
        
        const client = await pool.commands.connect();
        const collection = client.db('khafrabot').collection('trivia');
        const questions = await collection.aggregate([ 
            { $match: { category: category[0].name, difficulty } },
            { $sample: { size: parseInt(q) } } 
        ]).toArray();

        if(!questions || questions.length === 0) {
            return message.channel.send(this.Embed.fail('No questions found. 😦'));
        }
        
        const guesses: Record<string, string[]> = {}
        const winner: GuildMember[] = [];

        let msg: Message = null;
        games[message.guild.id] = message.channel.id;

        for(const question of questions) {
            if(msg?.deleted) {
                delete games[message.guild.id];
                return;
            }
            
            const answers = shuffle([question.correct_answer, ...question.incorrect_answers]).map(e => decode(e, 1));
            const index = questions.indexOf(question);
            const embed = this.Embed.success()
                .setTitle(`${question.category} - ${question.difficulty}`)
                .setDescription(`
                \`\`${decode(question.question, 1)}\`\`
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
                time: 30000,
                max: 1
            });

            await new Promise(r => {
                collector.on('collect', (m: Message) => {
                    winner.push(m.member);
                    collector.stop();
                });

                collector.on('end', r);
            });
        }

        delete games[message.guild.id];
        const won = winner.reduce((o, n) => {
            n.id in o ? (o[n.id]['n'] += 1) : (o[n.id] = { n: 1, m: n });
            return o;
        }, {} as Record<string, { n: number, m: GuildMember }>);
    
        if(!msg.deleted) {
            if(Object.values(won).length === 0) {
                return msg.edit(this.Embed.success(`No one guessed any questions correctly.`));
            }

            const w = Object.values(won).shift();
            return msg.edit(this.Embed.success(`
            ${w.m} won the game with ${w.n} correct answer(s)!
            `));
        }
    }
}