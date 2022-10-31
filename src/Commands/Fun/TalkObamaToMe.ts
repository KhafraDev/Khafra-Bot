import { Command } from '#khaf/Command'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Have Obama say something to you.',
        'Khafra Bot is the best!'
      ],
      {
        name: 'talkobamatome',
        folder: 'Fun',
        aliases: ['totm'],
        args: [1]
      }
    )
  }

  async init (): Promise<void> {}
}
