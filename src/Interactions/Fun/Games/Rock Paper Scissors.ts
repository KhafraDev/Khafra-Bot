import { InteractionSubCommand } from '#khaf/Interaction';
import { Components } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { ActionRow, inlineCode } from '@khaf/builders';
import { InteractionType } from 'discord-api-types/v9';
import { ChatInputCommandInteraction, InteractionCollector, MessageComponentInteraction } from 'discord.js';

type Keys = keyof typeof emojis;

const emojis = {
    rock: '🌑', 
    paper: '🧻', 
    scissors: '✂️'
} as const;

const row = new ActionRow().addComponents(
    Components.primary('🌑', 'rock'),
    Components.secondary('🧻', 'paper'),
    Components.approve('✂️', 'scissors')
);

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'games',
            name: 'rockpaperscissors'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<string | undefined> {
        const [err, int] = await dontThrow(interaction.editReply({ 
            embeds: [
                Embed.ok(`Rock, paper, scissors, shoot!`)
            ],
            components: [row]
        }));

        if (err !== null) {
            return `❌ An unexpected error occurred: ${inlineCode(err.message)}`;
        }

        const collector = new InteractionCollector<MessageComponentInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: int,
            time: 15_000,
            max: 1,
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.id === i.message.id
        });

        const [canceled, c] = await dontThrow(new Promise<MessageComponentInteraction>((res, rej) => {
            collector.once('collect', (i) => {
                collector.stop('res');
                return res(i);
            });

            collector.once('end', (_, reason) => {
                if (reason !== 'res') rej(reason);
            });
        }));

        if (canceled !== null) {
            return void dontThrow(interaction.editReply({
                embeds: [
                    Embed.error(`❌ Game was canceled! Play again another time.`)
                ],
                components: []
            }));
        }

        const botChoice = Object.keys(emojis)[Math.floor(Math.random() * 3)] as Keys;
        let embed = Embed.ok(`You lost - ${botChoice} beats ${c.customId}!`);

        if (c.customId === botChoice) {
            embed = Embed.ok(`It's a tie - we both chose ${emojis[botChoice]}!`);
        } else if (
            (c.customId === 'rock' && botChoice === 'scissors') || // rock beats scissors
            (c.customId === 'paper' && botChoice === 'rock') || // paper beats rock
            (c.customId === 'scissors' && botChoice === 'paper') // scissors beats paper
        ) {
            embed = Embed.ok(`You win with ${emojis[c.customId]}, I chose ${emojis[botChoice]}!`)
        }

        return void dontThrow(c.update({
            embeds: [embed],
            components: []
        }));
    }
} 