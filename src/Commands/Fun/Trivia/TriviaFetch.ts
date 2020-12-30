import { Command } from '../../../Structures/Command.js';
import { Message } from 'discord.js';
import { Trivia } from '../../../lib/Backend/Trivia/Trivia.js';
import { pool } from '../../../Structures/Database/Mongo.js';
import { Question } from '../../../lib/Backend/Trivia/types/Trivia';
import { inspect } from 'util';

export default class extends Command {
    constructor() {
        super(
            [
                'Fetch all the Trivia questions and insert them into the database.',
                ''
            ],
			{
                name: 'triviafetch',
                folder: 'Trivia',
                ownerOnly: true,
                args: [0, 0]
            }
        );
    }

    async init(message: Message) {
        message.channel.startTyping();
        const client = await pool.commands.connect();
        const collection = client.db('khafrabot').collection('trivia');
        if(await collection.findOne({})) {
            message.channel.stopTyping();
            return message.reply(this.Embed.fail('Trivia questions already exist in database. '));
        }

        let questions: Question[] = [];
        try {
            questions = await Trivia.fetchAllQuestions();
        } catch(e) {
            return message.reply(this.Embed.fail(inspect(e)));
        }

        message.channel.stopTyping();
        const inserted = await collection.insertMany(questions);
        return message.reply(this.Embed.success(`Added ${inserted.insertedCount.toLocaleString()} questions!`));
    }
}