import { Command } from '#khaf/Command'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get the number of members in a guild!'
      ],
      {
        name: 'members',
        folder: 'Server',
        args: [0, 0],
        guildOnly: true,
        ratelimit: 3,
        aliases: ['membercount']
      }
    )
  }

  async init (): Promise<void> {}
}
