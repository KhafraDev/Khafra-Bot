import { Command } from '#khaf/Command'
import { PermissionFlagsBits } from 'discord-api-types/v10'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Play a game in VC!',
        '866022233330810930 [channel id]',
        '#general [channel mention]'
      ],
      {
        name: 'activity',
        folder: 'Server',
        args: [1, 1],
        ratelimit: 10,
        permissions: [
          PermissionFlagsBits.CreateInstantInvite,
          PermissionFlagsBits.UseEmbeddedActivities
        ],
        guildOnly: true
      }
    )
  }

  async init (): Promise<void> {}
}
