import { KhafraClient } from '#khaf/Bot'
import type { Arguments} from '#khaf/Command'
import { Command } from '#khaf/Command'
import { chunkSafe } from '#khaf/utility/Array.js'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { dontThrow } from '#khaf/utility/Don\'tThrow.js'
import { bold, codeBlock, hyperlink, inlineCode } from '@discordjs/builders'
import type { APIActionRowComponent, APIEmbed, APIMessageActionRowComponent } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

let folders: string[]

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Display examples and description of a command!',
                'say',
                ''
            ],
            {
                name: 'help',
                folder: 'Bot',
                aliases: ['commandlist', 'list'],
                args: [0, 1],
                ratelimit: 3
            }
        )
    }

    async init (message: Message, { args }: Arguments): Promise<undefined | APIEmbed> {
        folders ??= [...new Set([...KhafraClient.Commands.values()].map(c => c.settings.folder))]

        if (args.length !== 0) {
            const commandName = args[0].toLowerCase()
            if (!KhafraClient.Commands.has(commandName))
                return Embed.error(`${inlineCode(commandName.slice(0, 100))} is not a valid command name. 😕`)

            const { settings, help, rateLimit } = KhafraClient.Commands.get(commandName)!
            const helpF = help.length === 2 && help[1] === ''
                ? [help[0], '[No arguments]']
                : help
            const aliases = settings.aliases!.length === 0
                ? ['No aliases!']
                : settings.aliases!

            return Embed.json({
                color: colors.ok,
                description: `
                The ${inlineCode(settings.name)} command:
                ${codeBlock(help.shift()!)}
    
                Aliases: ${aliases.map(a => inlineCode(a)).join(', ')}
                Example:
                ${helpF.map(c => inlineCode(`${settings.name} ${c || '​'}`).trim()).join('\n')}`,
                fields: [
                    { name: bold('Guild Only:'), value: settings.guildOnly ? 'Yes' : 'No', inline: true },
                    { name: bold('Owner Only:'), value: settings.ownerOnly ? 'Yes' : 'No', inline: true },
                    { name: bold('Rate-Limit:'), value: `${rateLimit.rateLimitSeconds} seconds`, inline: true}
                ]
            })
        }

        const categoryComponent = Components.actionRow([
            Components.selectMenu({
                custom_id: 'help',
                placeholder: 'Select a category of commands!',
                options: folders.map((f) => ({
                    label: f,
                    description: `Select the ${f} category!`,
                    value: f
                }))
            })
        ])

        const m = await message.channel.send({
            embeds: [
                Embed.ok(`
                ${hyperlink('Khafra-Bot', 'https://github.com/KhafraDev/Khafra-Bot')}
                
                To get help on a single command use ${inlineCode('help [command name]')}!
                `)
            ],
            components: [categoryComponent]
        }) as Message<true>

        let pages: APIEmbed[] = [],
            page = 0

        const c = m.createMessageComponentCollector({
            time: 60_000,
            max: 10,
            filter: (interaction) => interaction.user.id === message.author.id
        })

        c.on('collect', (i) => {
            if (i.isSelectMenu()) {
                const category = i.values[0]
                if (!folders!.includes(category)) return

                pages = []
                page = 0
                const all: Command[] = []

                for (const command of KhafraClient.Commands.values()) {
                    if (all.includes(command)) continue
                    if (command.settings.folder !== category) continue

                    all.push(command)
                }

                for (const chunk of chunkSafe(all, 20)) {
                    let desc = ''
                    for (const { settings, help } of chunk) {
                        if (help[0])
                            desc += `${bold(settings.name)}: ${inlineCode(help[0].slice(0, 190 - settings.name.length))}\n`
                        else
                            desc += `${bold(settings.name)}: ${inlineCode('No description')}`
                    }

                    pages.push(Embed.ok(desc))
                }

                const components: APIActionRowComponent<APIMessageActionRowComponent>[] = []
                if (pages.length > 1) {
                    components.push(
                        Components.actionRow([
                            Buttons.deny('Previous', 'previous'),
                            Buttons.approve('Next', 'next'),
                            Buttons.secondary('Stop', 'stop')
                        ])
                    )
                }

                components.push(categoryComponent)

                return void dontThrow(i.update({
                    embeds: [pages[page]],
                    components
                }))
            } else {
                if (i.customId === 'stop') {
                    c.stop()
                    return void dontThrow(i.update({ components: disableAll(m) }))
                } else if (i.customId === 'previous') {
                    page = --page < 0 ? pages.length - 1 : page
                } else {
                    page = ++page >= pages.length ? 0 : page
                }

                return void dontThrow(i.update({ embeds: [pages[page]] }))
            }
        })

        c.once('end', () => {
            for (const { components } of m.components) {
                for (const component of components) {
                    if (component.disabled) return
                }
            }

            return void dontThrow<Message<boolean>>(m.edit({
                components: disableAll(m)
            }))
        })
    }
}