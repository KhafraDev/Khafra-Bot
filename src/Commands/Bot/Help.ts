import { KhafraClient } from '#khaf/Bot'
import { Command, type Arguments } from '#khaf/Command'
import { chunkSafe } from '#khaf/utility/Array.js'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { bold, codeBlock, hyperlink, inlineCode } from '@discordjs/builders'
import type { APIActionRowComponent, APIEmbed, APIMessageActionRowComponent, ComponentType } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { randomUUID } from 'node:crypto'

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
    const folders = [...new Set([...KhafraClient.Commands.values()].map(c => c.settings.folder))]

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

    const id = randomUUID()
    const categoryComponent = Components.actionRow([
      Components.selectMenu({
        custom_id: `help-${id}`,
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
    })

    const collector = m.createMessageComponentCollector<
      ComponentType.Button |
      ComponentType.StringSelect
    >({
      idle: 60_000,
      max: 10,
      filter: (i) =>
        i.user.id === message.author.id &&
        i.customId.endsWith(`-${id}`)
    })

    const pages: APIEmbed[] = []
    let page = 0

    for await (const [i] of collector) {
      if (i.isSelectMenu()) {
        const category = i.values[0]

        pages.length = page = 0

        const all: Command[] = []

        for (const command of KhafraClient.Commands.values()) {
          if (all.includes(command)) continue
          if (command.settings.folder !== category) continue

          all.push(command)
        }

        for (const chunk of chunkSafe(all, 20)) {
          let desc = ''
          for (const { settings, help } of chunk) {
            if (help[0]) {
              desc += `${bold(settings.name)}: ${inlineCode(help[0].slice(0, 190 - settings.name.length))}\n`
            } else {
              desc += `${bold(settings.name)}: ${inlineCode('No description')}`
            }
          }

          pages.push(Embed.ok(desc))
        }

        const components: APIActionRowComponent<APIMessageActionRowComponent>[] = [
          categoryComponent
        ]

        if (pages.length > 1) {
          components.push(
            Components.actionRow([
              Buttons.deny('Previous', `previous-${id}`),
              Buttons.approve('Next', `next-${id}`),
              Buttons.secondary('Stop', `stop-${id}`)
            ])
          )
        }

        await i.update({
          embeds: [pages[page]],
          components
        })
      } else {
        const [customId] = i.customId.split('-')

        if (customId === 'stop') {
          collector.stop()
          break
        }

        customId === 'next' ? page++ : page--
        if (page < 0) page = pages.length - 1
        if (page >= pages.length) page = 0

        await i.update({
          embeds: [pages[page]]
        })
      }
    }

    const last = collector.collected.last()

    if (
      collector.collected.size !== 0 &&
            last?.replied === false
    ) {
      return void await last.update({
        components: disableAll(m)
      })
    }

    return void await m.edit({
      components: disableAll(m)
    })
  }
}
