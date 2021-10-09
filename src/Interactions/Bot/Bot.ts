import { Interactions } from '../../Structures/Interaction.js';
import { bold, SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { KhafraClient } from '../../Bot/KhafraBot.js';
import { Embed } from '../../lib/Utility/Constants/Embeds.js';
import { performance } from 'perf_hooks';
import { Stats } from '../../lib/Utility/Stats.js';

enum BotInfo {
    UPTIME = 'uptime',
    ABOUT = 'about',
    PING = 'ping',
    STATS = 'stats',
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
                    .addChoice(BotInfo.UPTIME, BotInfo.UPTIME)
                    .addChoice(BotInfo.ABOUT, BotInfo.ABOUT)
                    .addChoice(BotInfo.PING, BotInfo.PING)
                    .addChoice(BotInfo.STATS, BotInfo.STATS)
                )
                .setDescription('General information about the bot.')
            )
            .setDescription('Bot commands');

        super(sc as unknown as SlashCommandBuilder);
    }

    async init(interaction: CommandInteraction) {
        const was = performance.now();
        const subcommand = interaction.options.getSubcommand(true);

        if (subcommand === 'info') {
            const option = interaction.options.getString('option', true);

            if (option === BotInfo.UPTIME || option === BotInfo.ABOUT) {
                const command = KhafraClient.Commands.get(option)!;

                const value = command.init({
                    client: interaction.client
                } as Message) as MessageEmbed;

                return value;
            } else if (option === BotInfo.PING) {
                await interaction.reply({
                    embeds: [Embed.success('Pinging...!')],
                    ephemeral: true
                });

                const now = performance.now();
                const embed = Embed.success(`
                Pong! 🏓

                Bot: ${(now - was).toFixed(2)} ms
                Heartbeat: ${interaction.client.ws.ping} ms
                `);

                await interaction.followUp({
                    embeds: [embed],
                    ephemeral: true
                });
            } else if (option === BotInfo.STATS) {
                const guilds = interaction.client.guilds.cache;
                const {
                    globalCommandsUsed,
                    globalMessages
                } = Stats.stats;

                const totalMembers = guilds.map(g => g.memberCount)
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString();
                const totalGuilds = guilds.size.toLocaleString();

                return Embed.success()
                    .setTitle(`Bot Statistics`)
                    .addFields(
                        { name: bold('Guilds:'), value: totalGuilds, inline: true },
                        { name: bold('Members:'), value: totalMembers, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: bold('Total Messages:'), value: globalMessages.toLocaleString(), inline: true },
                        { name: bold('Total Commands:'), value: globalCommandsUsed.toLocaleString(), inline: true },
                        { name: '\u200b', value: '\u200b', inline: true }
                    );
            }
        }
    }
} 