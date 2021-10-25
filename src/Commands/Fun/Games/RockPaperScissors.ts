import { Message, MessageActionRow, Permissions } from 'discord.js';
import { Components, disableAll } from '../../../lib/Utility/Constants/Components.js';
import { dontThrow } from '../../../lib/Utility/Don\'tThrow.js';
import { Command } from '../../../Structures/Command.js';
import { RegisterCommand } from '../../../Structures/Decorator.js';

const emojis = {
    rock: '🌑', 
    paper: '🧻', 
    scissors: '✂️'
} as const;

type Keys = keyof typeof emojis;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super([
            'Play a game of rock paper scissors against the bot!',
        ], {
            name: 'rockpaperscissors',
            folder: 'Games',
            args: [0, 0],
            ratelimit: 5,
            aliases: ['rps'],
            permissions: [Permissions.FLAGS.ADD_REACTIONS]
        });
    }

    async init(message: Message): Promise<void> {
        const row = new MessageActionRow()
            .addComponents(
                Components.primary('🌑', 'rock'),
                Components.secondary('🧻', 'paper'),
                Components.approve('✂️', 'scissors')
            );
        
        const m = await message.reply({ 
            embeds: [
                this.Embed.success(`Rock, paper, scissors, shoot!`)
            ],
            components: [row]
        });

        const [canceled, c] = await dontThrow(m.awaitMessageComponent({
            filter: (interaction) =>
                ['rock', 'paper', 'scissors'].includes(interaction.customId) &&
                interaction.user.id === message.author.id &&
                interaction.message.id === m.id,
            time: 20000
        }));

        if (canceled !== null) {
            return void m.edit({
                embeds: [
                    this.Embed.fail(`Game was canceled! Play again another time.`)
                ],
                components: []
            });
        }

        const botChoice = Object.keys(emojis)[Math.floor(Math.random() * 3)] as Keys;
        let embed = this.Embed.success(`You lost - ${botChoice} beats ${c.customId}!`);

        if (c.customId === botChoice) {
            embed = this.Embed.success(`It's a tie - we both chose ${emojis[botChoice]}!`);
        } else if (
            (c.customId === 'rock' && botChoice === 'scissors') || // rock beats scissors
            (c.customId === 'paper' && botChoice === 'rock') || // paper beats rock
            (c.customId === 'scissors' && botChoice === 'paper') // scissors beats paper
        ) {
            embed = this.Embed.success(`You win with ${emojis[c.customId]}, I chose ${emojis[botChoice]}!`)
        }

        return void c.update({
            embeds: [embed],
            components: disableAll(m)
        });
    }
}