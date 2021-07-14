import { Arguments, Command } from '../../Structures/Command.js';
import { Message, MessageActionRow, MessageEmbed, MessageSelectMenu } from 'discord.js';
import { RegisterCommand } from '../../Structures/Decorator.js';
import { KhafraClient } from '../../Bot/KhafraBot.js';
import { chunkSafe } from '../../lib/Utility/Array.js';
import { bold, inlineCode, hyperlink, codeBlock } from '@discordjs/builders';
import { Components, disableAll } from '../../lib/Utility/Constants/Components.js';
import { kGuild } from '../../lib/types/KhafraBot.js';

let folders: string[] | null = null;

@RegisterCommand
export class kCommand extends Command {
    constructor() {
        super(
            [
                'Display examples and description of a command!',
                'say',
                ''
            ],
			{
                name: 'help',
                folder: 'Bot',
                aliases: [ 'commandlist', 'list' ],
                args: [0, 1],
                ratelimit: 3
            }
        );
    }

    async init(message: Message, { args }: Arguments, settings: kGuild) {
        folders ??= [...new Set([...KhafraClient.Commands.values()].map(c => c.settings.folder))];

        if (args.length !== 0) {
            const commandName = args[0].toLowerCase();
            if (!KhafraClient.Commands.has(commandName))
                return this.Embed.fail(`${inlineCode(commandName.slice(0, 100))} is not a valid command name. 😕`);

            const { settings, help } = KhafraClient.Commands.get(commandName);
            const helpF = help.length === 2 && help[1] === ''
                ? [help[0], '[No arguments]']
                : help;
            const aliases = settings.aliases.length === 0
                ? ['No aliases!']
                : settings.aliases;

            return this.Embed.success(`
            The ${inlineCode(settings.name)} command:
            ${codeBlock(help.shift())}

            Aliases: ${aliases.map(a => inlineCode(a)).join(', ')}
            Example:
            ${helpF.map(c => inlineCode(`${settings.name} ${c || '​'}`).trim()).join('\n')}
            `)
            .addFields(
                { name: '**Guild Only:**', value: settings.guildOnly ? 'Yes' : 'No', inline: true },
                { name: '**Owner Only:**', value: settings.ownerOnly ? 'Yes' : 'No', inline: true },
                { name: '**Rate-Limit:**', value: `${settings.ratelimit} seconds`, inline: true}
            );
        }

        const m = await message.channel.send({
            embeds: [
                this.Embed.success(`
                ${hyperlink('Khafra-Bot', 'https://github.com/KhafraDev/Khafra-Bot')}
                
                To get help on a single command use ${inlineCode(`${settings.prefix}help [command name]`)}!
                `)
            ],
            components: [
                new MessageActionRow().addComponents(
                    new MessageSelectMenu()
                        .setCustomId('help')
                        .setPlaceholder('Select a category of commands!')
                        .addOptions(folders.map(f => ({
                            label: f,
                            description: `Select the ${f} category!`,
                            value: f
                        })))
                )
            ]
        });

        let pages: MessageEmbed[] = [],
            page = 0;

        const c = m.createMessageComponentCollector({
            time: 60_000,
            max: 10,
            filter: (interaction) =>
                interaction.user.id === message.author.id
        });

        c.on('collect', (i) => {
            if (i.isSelectMenu()) {
                const category = i.values[0];
                if (!folders.includes(category)) return;

                pages = [];
                page = 0;
                const all: Command[] = [];
                
                for (const command of KhafraClient.Commands.values()) {
                    if (all.includes(command)) continue;
                    if (command.settings.folder !== category) continue;

                    all.push(command);
                }

                for (const chunk of chunkSafe(all, 20)) {
                    let desc = '';
                    for (const { settings, help } of chunk) {
                        desc += `${bold(settings.name)}: ${inlineCode(help[0].slice(0, 190 - settings.name.length))}\n`;
                    }

                    pages.push(this.Embed.success(desc));
                }

                const components: MessageActionRow[] = [];
                if (pages.length > 1) {
                    components.push(
                        new MessageActionRow().addComponents(
                            Components.deny('Previous', 'previous'),
                            Components.approve('Next', 'next'),
                            Components.secondary('Stop', 'stop')
                        )
                    );
                }

                if (m.components.length === 1)
                    components.push(...m.components);
                else
                    components.push(m.components[m.components.length - 1]);

                return i.update({ 
                    embeds: [pages[page]],
                    components
                });
            } else {
                if (i.customId === 'stop') {
                    c.stop();
                    return i.update({ components: disableAll(m) });
                } else if (i.customId === 'previous') {
                    page = --page < 0 ? pages.length - 1 : page;
                } else {
                    page = ++page >= pages.length ? 0 : page;
                }

                return i.update({ embeds: [pages[page]] });
            }
        });
    }
}