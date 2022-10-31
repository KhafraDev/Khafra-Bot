import { Command } from '#khaf/Command'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Create a poll in a channel.',
        ''
      ],
      {
        name: 'poll',
        folder: 'Server',
        args: [0, 0],
        aliases: ['strawpoll'],
        ratelimit: 30,
        guildOnly: true
      }
    )
  }

  async init (): Promise<void> {}
}
