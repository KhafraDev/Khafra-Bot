import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { getMentions } from '#khaf/utility/Mentions.mjs'
import { days, minutes, parseStrToMs } from '#khaf/utility/ms.mjs'
import { hierarchy } from '#khaf/utility/Permissions.mjs'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import { type ComponentType, PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const schema = s.number.int.greaterThanOrEqual(0).lessThanOrEqual(7)

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Ban a member from the guild, prompts you for confirmation first.',
        '@user 3d for a good reason',
        '@user 0 bye!',
        '239566240987742220 7d'
      ],
      {
        name: 'banprompt',
        folder: 'Moderation',
        aliases: ['bnaprompt'],
        args: [1],
        guildOnly: true,
        permissions: [PermissionFlagsBits.BanMembers]
      }
    )
  }

  async init (message: Message<true>, { args, content }: Arguments): Promise<undefined | APIEmbed> {
    const user = await getMentions(message, 'users', content)
    const clear = typeof args[1] === 'string' ? Math.ceil(parseStrToMs(args[1]) / 86400000) : 7
    const reason = args.slice(args[1] && parseStrToMs(args[1]) ? 2 : 1).join(' ')

    const member = user && message.guild.members.resolve(user)
    if (member && !hierarchy(message.member, member)) {
      return Embed.error(`You do not have permission to ban ${member}!`)
    } else if (!user) {
      return Embed.error('No user id or user mentioned, no one was banned.')
    }

    const row = Components.actionRow([
      Buttons.approve('Yes'),
      Buttons.deny('No')
    ])

    const msg = await message.reply({
      embeds: [Embed.ok(`Are you sure you want to ban ${user}?`)],
      components: [row]
    })

    const button = await msg.awaitMessageComponent<ComponentType.Button>({
      filter: (interaction) =>
        ['approve', 'deny'].includes(interaction.customId)
        && interaction.user.id === message.author.id
        && interaction.message.id === msg.id,
      time: minutes(1)
    }).catch(() => null)

    if (button === null) {
      return void msg.edit({
        embeds: [Embed.error(`Didn't get confirmation to ban ${user}!`)],
        components: []
      })
    }

    if (button.customId === 'deny') {
      return void button.update({
        embeds: [Embed.error(`${user} gets off lucky... this time (command was canceled)!`)],
        components: []
      })
    }

    await button.deferUpdate()

    try {
      await message.guild.members.ban(user, {
        deleteMessageSeconds: schema.is(clear) ? clear * days(0.001) : days(0.007),
        reason: reason.length > 0 ? reason : `Requested by ${message.author.id}`
      })
    } catch {
      return void button.editReply({
        embeds: [Embed.error(`${user} isn't bannable!`)],
        components: []
      })
    }

    await button.editReply({
      embeds: [
        Embed.ok(
          `${user} has been banned from the guild and ${
            Number.isNaN(clear) ? '7' : clear
          } days worth of messages have been removed.`
        )
      ],
      components: disableAll(msg)
    })
  }
}
