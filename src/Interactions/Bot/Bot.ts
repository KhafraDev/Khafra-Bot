import { Interactions } from '#khaf/Interaction';
import { Embed } from '#khaf/utility/Constants/Embeds.js';
import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { Stats } from '#khaf/utility/Stats.js';
import { bold, inlineCode } from '@discordjs/builders';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction, InteractionReplyOptions, version as DJSVersion } from 'discord.js';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { memoryUsage, version } from 'process';

enum BotInfo {
    ABOUT = 'about',
    PING = 'ping',
    STATS = 'stats',
}

const pkg = createFileWatcher({} as typeof import('../../../package.json'), join(cwd, 'package.json'));

const getUptime = (ms: number): string => {
    return Object.entries({
        d: Math.floor(ms / 86400000),
        h: Math.floor(ms / 3600000) % 24,
        m: Math.floor(ms / 60000) % 60,
        s: Math.floor(ms / 1000) % 60,
        ms: Math.floor(ms) % 1000
    })
        .filter(f => f[1] > 0)
        .map(t => `${t[1]}${t[0]}`)
        .join(' ');
}

export class kInteraction extends Interactions {
    constructor () {
        const sc: RESTPostAPIApplicationCommandsJSONBody = {
            name: 'bot',
            description: 'Bot commands',
            options: [
                {
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'info',
                    description: 'General information about the bot.',
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'option',
                            description: 'basic info about the bot',
                            required: true,
                            choices: [
                                { name: BotInfo.ABOUT, value: BotInfo.ABOUT },
                                { name: BotInfo.PING, value: BotInfo.PING },
                                { name: BotInfo.STATS, value: BotInfo.STATS }
                            ]
                        }
                    ]
                }
            ]
        };

        super(sc);
    }

    async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | undefined> {
        const was = performance.now();
        const subcommand = interaction.options.getSubcommand(true);

        if (subcommand === 'info') {
            const option = interaction.options.getString('option', true);

            if (option === BotInfo.ABOUT) {
                const memoryMB = memoryUsage().heapUsed / 2 ** 20; // same as 1024 * 1024
                const uptime = getUptime(interaction.client.uptime ?? 0);

                const embed = Embed.ok()
                    .setDescription(`
                    ${bold('Dependencies')}
                    ${Object.keys(pkg.dependencies).map(k => `[${k}](https://npmjs.com/package/${k})`).join(', ')}
                    `)
                    .addFields(
                        { name: bold('Memory:'), value: `${memoryMB.toFixed(2)} MB` },
                        { name: bold('Khafra-Bot:'), value: `v${pkg.version}`, inline: true },
                        { name: bold('Discord.js:'), value: `v${DJSVersion}`, inline: true },
                        { name: bold('Node.JS:'), value: version, inline: true },
                        { name: bold('Uptime:'), value: `⏰ ${inlineCode(uptime)}` }
                    );

                return {
                    embeds: [embed]
                }
            } else if (option === BotInfo.PING) {
                await interaction.reply({
                    embeds: [Embed.ok('Pinging...!')],
                    ephemeral: true
                });

                const now = performance.now();
                const embed = Embed.ok(`
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

                const embed = Embed.ok()
                    .setTitle('Bot Statistics')
                    .addFields(
                        { name: bold('Guilds:'), value: totalGuilds, inline: true },
                        { name: bold('Members:'), value: totalMembers, inline: true },
                        { name: '\u200b', value: '\u200b', inline: true },
                        { name: bold('Total Messages:'), value: globalMessages.toLocaleString(), inline: true },
                        { name: bold('Total Commands:'), value: globalCommandsUsed.toLocaleString(), inline: true },
                        { name: '\u200b', value: '\u200b', inline: true }
                    );

                return {
                    embeds: [embed]
                }
            }
        }
    }
}