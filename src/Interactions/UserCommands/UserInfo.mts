import { InteractionUserCommand } from '#khaf/Interaction'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { formatPresence, userflagBitfieldToEmojis } from '#khaf/utility/util.mjs'
import { bold, time } from '@discordjs/builders'
import { ApplicationCommandType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { InteractionReplyOptions, UserContextMenuCommandInteraction } from 'discord.js'

export class kUserCommand implements InteractionUserCommand<UserContextMenuCommandInteraction> {
  data: RESTPostAPIApplicationCommandsJSONBody = {
    name: 'User info',
    type: ApplicationCommandType.User
  }

  async handle (interaction: UserContextMenuCommandInteraction): Promise<InteractionReplyOptions> {
    const { targetUser: user, guild } = interaction

    const member = await guild?.members.fetch(user.id).catch(() => null) ?? null
    const flags = user.flags?.bitfield
    const badgeEmojis = userflagBitfieldToEmojis(flags)

    return {
      embeds: [
        Embed.json({
          color: colors.ok,
          description: formatPresence(member?.presence?.activities),
          author: {
            name: user.tag,
            icon_url: user.displayAvatarURL()
          },
          fields: [
            { name: bold('Username:'), value: user.username, inline: true },
            { name: bold('ID:'), value: user.id, inline: true },
            { name: bold('Discriminator:'), value: `#${user.discriminator}`, inline: true },
            { name: bold('Bot:'), value: user.bot ? 'Yes' : 'No', inline: true },
            {
              name: bold('Badges:'),
              value: `${badgeEmojis.length > 0 ? badgeEmojis.join(' ') : 'None/Unknown'}`,
              inline: true
            },
            { name: bold('Account Created:'), value: time(user.createdAt, 'f'), inline: true }
          ]
        })
      ],
      ephemeral: true
    }
  }
}
