import { Interactions } from '../../Structures/Interaction.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { KhafraClient } from '../../Bot/KhafraBot.js';

enum BotInfo {
    UPTIME = 'uptime',
    ABOUT = 'about'
}

export class kInteraction extends Interactions {
    constructor() {
        const sc = new SlashCommandBuilder()
            .setName('bot')
            .addSubcommand(command => command
                .setName('info')
                .addStringOption(option => option
                    .setName('option')
                    .setDescription('basic info about the bot')
                    .setRequired(true)
                    .addChoice('uptime', BotInfo.UPTIME)
                    .addChoice('about', BotInfo.ABOUT)
                )
                .setDescription('General information about the bot.')
            )
            .setDescription('Bot commands');

        super(sc as unknown as SlashCommandBuilder);
    }

    async init(interaction: CommandInteraction) {
        const subcommand = interaction.options.getSubcommand(true);

        if (subcommand === 'info') {
            const option = interaction.options.getString('option', true);
            const command = KhafraClient.Commands.get(option)!;

            const value = command.init({
                client: interaction.client
            } as Message) as MessageEmbed;

            return value;
        }
    }
} 