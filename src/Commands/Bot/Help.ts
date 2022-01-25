import { KhafraClient } from '#khaf/Bot';
import { Arguments, Command } from '#khaf/Command';
import { kGuild } from '#khaf/types/KhafraBot.js';
import { chunkSafe } from '#khaf/utility/Array.js';
import { Components, disableAll } from '#khaf/utility/Constants/Components.js';
import { dontThrow } from '#khaf/utility/Don\'tThrow.js';
import { ActionRow, ActionRowComponent, bold, codeBlock, Embed, hyperlink, inlineCode, SelectMenuComponent, SelectMenuOption } from '@khaf/builders';
import { Message } from 'discord.js';

let folders: string[] | null = null;

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
                return this.Embed.error(`${inlineCode(commandName.slice(0, 100))} is not a valid command name. 😕`);

            const { settings, help, rateLimit } = KhafraClient.Commands.get(commandName)!;
            const helpF = help.length === 2 && help[1] === ''
                ? [help[0], '[No arguments]']
                : help;
            const aliases = settings.aliases!.length === 0
                ? ['No aliases!']
                : settings.aliases!;

            return this.Embed.ok(`
            The ${inlineCode(settings.name)} command:
            ${codeBlock(help.shift()!)}

            Aliases: ${aliases.map(a => inlineCode(a)).join(', ')}
            Example:
            ${helpF.map(c => inlineCode(`${settings.name} ${c || '​'}`).trim()).join('\n')}
            `)
            .addFields(
                { name: bold('Guild Only:'), value: settings.guildOnly ? 'Yes' : 'No', inline: true },
                { name: bold('Owner Only:'), value: settings.ownerOnly ? 'Yes' : 'No', inline: true },
                { name: bold('Rate-Limit:'), value: `${rateLimit.rateLimitSeconds} seconds`, inline: true}
            );
        }

        const m = await message.channel.send({
            embeds: [
                this.Embed.ok(`
                ${hyperlink('Khafra-Bot', 'https://github.com/KhafraDev/Khafra-Bot')}
                
                To get help on a single command use ${inlineCode(`${settings.prefix}help [command name]`)}!
                `)
            ],
            components: [
                new ActionRow().addComponents(
                    new SelectMenuComponent()
                        .setCustomId('help')
                        .setPlaceholder('Select a category of commands!')
                        .addOptions(...folders.map(f => new SelectMenuOption({
                            label: f,
                            description: `Select the ${f} category!`,
                            value: f
                        })))
                )
            ]
        });

        let pages: Embed[] = [],
            page = 0;

        const c = m.createMessageComponentCollector({
            time: 60_000,
            max: 10,
            filter: (interaction) => interaction.user.id === message.author.id
        });

        c.on('collect', (i) => {
            if (i.isSelectMenu()) {
                const category = i.values[0];
                if (!folders!.includes(category)) return;

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
                        if (help[0])
                            desc += `${bold(settings.name)}: ${inlineCode(help[0].slice(0, 190 - settings.name.length))}\n`;
                        else
                            desc += `${bold(settings.name)}: ${inlineCode('No description')}`
                    }

                    pages.push(this.Embed.ok(desc));
                }

                const components: ActionRow<ActionRowComponent>[] = [];
                if (pages.length > 1) {
                    components.push(
                        new ActionRow().addComponents(
                            Components.deny('Previous', 'previous'),
                            Components.approve('Next', 'next'),
                            Components.secondary('Stop', 'stop')
                        )
                    );
                }

                if (m.components.length === 1) {
                    components.push(...m.components.map(c => new ActionRow(c)));
                } else {
                    components.push(new ActionRow(m.components.at(-1)));
                }

                return void dontThrow(i.update({ 
                    embeds: [pages[page]],
                    components
                }));
            } else {
                if (i.customId === 'stop') {
                    c.stop();
                    return void dontThrow(i.update({ components: disableAll(m) }));
                } else if (i.customId === 'previous') {
                    page = --page < 0 ? pages.length - 1 : page;
                } else {
                    page = ++page >= pages.length ? 0 : page;
                }

                return void dontThrow(i.update({ embeds: [pages[page]] }));
            }
        });

        c.once('end', () => {
            for (const { components } of m.components) {
                for (const component of components) {
                    if (component.disabled) return;
                }
            }
            
            return void dontThrow(m.edit({
                components: disableAll(m)
            }));
        });
    }
}