import { ApplicationCommandOption, CommandInteraction } from 'discord.js';
import { rand } from '../lib/Utility/Constants/OneLiners.js';
import { RegisterInteraction } from '../Structures/Decorator.js';
import { Interactions } from '../Structures/Interaction.js';

type Choice = { name: 'choice', type: 'STRING', value: 'choice_rock' | 'choice_paper' | 'choice_scissors' };

const emojis = {
    choice_rock: '🪨',
    choice_paper: '🧻',
    choice_scissors: '✂️'
} as const;

@RegisterInteraction
export class kInteraction extends Interactions {
    data: ApplicationCommandOption = {
        type: 'STRING',
        name: 'rps',
        description: 'Play rock paper scissors against the bot!',
        required: true,
        options: [
            {
                name: 'choice',
                description: 'Your choice of rock, paper, or scissors to play against the bot.',
                type: 'STRING',
                required: true,
                choices: [
                    { name: 'Rock', value: 'choice_rock' },
                    { name: 'Paper', value: 'choice_paper' },
                    { name: 'Scissors', value: 'choice_scissors' }
                ]
            }
        ]
    };

    async init(interaction: CommandInteraction) {
        const { value } = interaction.options[0]! as Choice;
        const emoji = Object.values(emojis);
        const botChoice = emoji[await rand(emoji.length)];

        if (emojis[value] === botChoice)
            return `It's a tie! ${botChoice}`;

        if (
            (value === 'choice_rock' && botChoice === '✂️') || // rock beats scissors
            (value === 'choice_paper' && botChoice === '🪨') || // paper beats rock
            (value === 'choice_scissors' && botChoice === '🧻')   // scissors beats paper
        )
            return `${emojis[value]} You win, I chose ${botChoice}!`;

        return `${botChoice} I win, you chose ${emojis[value]}!`;
    }
}