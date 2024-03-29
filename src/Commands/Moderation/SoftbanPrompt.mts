import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { getMentions } from '#khaf/utility/Mentions.mjs'
import { days, parseStrToMs, seconds } from '#khaf/utility/ms.mjs'
import { plural } from '#khaf/utility/String.mjs'
import { bold } from '@discordjs/builders'
import { s } from '@sapphire/shapeshift'
import { type APIEmbed, type ComponentType, PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const schema = s.number.int.greaterThanOrEqual(0).greaterThanOrEqual(7)

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Softban a member (bans and instantly unbans them; clearing recent messages).\n'
        + 'Will prompt you to confirm before soft-banning them.',
        '@user for a good reason',
        '@user bye!',
        '239566240987742220'
      ],
      {
        name: 'softbanprompt',
        folder: 'Moderation',
        aliases: ['softbnaprompt'],
        args: [1],
        guildOnly: true,
        permissions: [PermissionFlagsBits.BanMembers]
      }
    )
  }

  async init (message: Message<true>, { args, content }: Arguments): Promise<undefined | APIEmbed> {
    const user = await getMentions(message, 'users', content)
    if (!user) {
      return Embed.error('No user mentioned and/or an invalid ❄️ was used!')
    }

    const clear = typeof args[1] === 'string'
      ? Math.ceil(parseStrToMs(args[1])! / 86400000)
      : 7
    const reason = args.slice(args[1] && parseStrToMs(args[1]) ? 2 : 1).join(' ')

    const row = Components.actionRow([
      Buttons.approve('Yes'),
      Buttons.deny('No')
    ])

    const msg = await message.reply({
      embeds: [
        Embed.ok(
          `
        Are you sure you want to soft-ban ${user}? 

        This will delete ${clear} day${plural(clear)} worth of messages from them, `
            + `but they ${bold('will be')} allowed to rejoin the guild.
        `
        )
      ],
      components: [row]
    })

    const button = await msg.awaitMessageComponent<ComponentType.Button>({
      filter: (interaction) =>
        ['approve', 'deny'].includes(interaction.customId)
        && interaction.user.id === message.author.id
        && interaction.message.id === msg.id,
      time: seconds(20)
    }).catch(() => null)

    if (button === null) {
      return void msg.edit({
        embeds: [Embed.error(`Didn't get confirmation to soft-ban ${user}!`)],
        components: []
      })
    } else if (button.customId === 'deny') {
      return void button.update({
        embeds: [Embed.error(`${user} gets off lucky... this time (command was canceled)!`)],
        components: []
      })
    }

    await button.deferUpdate()

    try {
      await message.guild.members.ban(user, {
        deleteMessageSeconds: schema.is(clear) ? clear * days(0.001) : days(0.007),
        reason
      })
      await message.guild.members.unban(user, `Khafra-Bot: softban by ${message.author.tag} (${message.author.id})`)
    } catch {
      return void button.editReply({
        embeds: [Embed.error(`${user} isn't bannable!`)],
        components: []
      })
    }

    return void button.editReply({
      embeds: [Embed.ok(`${user} has been soft-banned from the guild!`)],
      components: disableAll(msg)
    })
  }
}
