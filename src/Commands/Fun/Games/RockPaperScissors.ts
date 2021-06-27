import { Message, MessageActionRow, MessageComponentInteraction, Permissions } from 'discord.js';
import { Components } from '../../../lib/Utility/Constants/Components.js';
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
            ratelimit: 10,
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

        let c: MessageComponentInteraction | null = null;
        try {
            c = await m.awaitMessageComponentInteraction({
                filter: (interaction) =>
                    ['rock', 'paper', 'scissors'].includes(interaction.customID) &&
                    interaction.user.id === message.author.id &&
                    interaction.message.id === m.id,
                time: 20000
            });
        } catch {
            return void m.edit({
                embeds: [
                    this.Embed.fail(`Game was canceled! Play again another time.`)
                ],
                components: []
            });
        }

        const botChoice = Object.keys(emojis)[Math.floor(Math.random() * 3)] as Keys;
        let embed = this.Embed.success(`You lost - ${botChoice} beats ${c.customID}!`);

        if (c.customID === botChoice) {
            embed = this.Embed.success(`It's a tie - we both chose ${emojis[botChoice]}!`);
        } else if (
            (c.customID === 'rock' && botChoice === 'scissors') || // rock beats scissors
            (c.customID === 'paper' && botChoice === 'rock') || // paper beats rock
            (c.customID === 'scissors' && botChoice === 'paper') // scissors beats paper
        ) {
            embed = this.Embed.success(`You win with ${emojis[c.customID]}, I chose ${emojis[botChoice]}!`)
        }

        return void c.update({
            embeds: [embed],
            components: []
        });
    }
}