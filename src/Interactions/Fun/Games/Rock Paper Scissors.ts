import { InteractionSubCommand } from '#khaf/Interaction';
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { randomUUID } from 'node:crypto';
import { InteractionType } from 'discord-api-types/v10';
import type { ButtonInteraction, ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { InteractionCollector } from 'discord.js';

type Keys = keyof typeof emojis;

const emojis = {
    rock: '🌑',
    paper: '🧻',
    scissors: '✂️'
} as const;

export class kSubCommand extends InteractionSubCommand {
    constructor () {
        super({
            references: 'games',
            name: 'rockpaperscissors'
        });
    }

    async handle (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        const id = randomUUID();
        const row = Components.actionRow([
            Buttons.primary('🌑', `rock-${id}`),
            Buttons.secondary('🧻', `paper-${id}`),
            Buttons.approve('✂️', `scissors-${id}`)
        ]);

        const int = await interaction.editReply({
            embeds: [
                Embed.ok('Rock, paper, scissors, shoot!')
            ],
            components: [row]
        });

        const collector = new InteractionCollector<ButtonInteraction>(interaction.client, {
            interactionType: InteractionType.MessageComponent,
            message: int,
            time: 15_000,
            max: 1,
            filter: (i) =>
                interaction.user.id === i.user.id &&
                int.id === i.message.id &&
                i.customId.endsWith(id)
        });

        let c: ButtonInteraction | undefined;

        for await (const [i] of collector) {
            c = i;
        }

        if (c === undefined) {
            return void dontThrow(interaction.editReply({
                embeds: [
                    Embed.error('❌ Game was canceled! Play again another time.')
                ],
                components: disableAll(int)
            }));
        }

        const botChoice = Object.keys(emojis)[Math.floor(Math.random() * 3)] as Keys;
        const userChoice = c.customId.split('-')[0];
        let embed = Embed.ok(`You lost - ${botChoice} beats ${userChoice}!`);

        if (userChoice === botChoice) {
            embed = Embed.ok(`It's a tie - we both chose ${emojis[botChoice]}!`);
        } else if (
            (userChoice === 'rock' && botChoice === 'scissors') || // rock beats scissors
            (userChoice === 'paper' && botChoice === 'rock') || // paper beats rock
            (userChoice === 'scissors' && botChoice === 'paper') // scissors beats paper
        ) {
            embed = Embed.ok(`You win with ${emojis[userChoice]}, I chose ${emojis[botChoice]}!`)
        }

        return void dontThrow(c.update({
            embeds: [embed],
            components: disableAll(int)
        }));
    }
}