import { Command } from '#khaf/Command'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get a bad meme!',
        'pewdiepiesubmissions', ''
      ],
      {
        name: 'badmeme',
        folder: 'Fun',
        args: [0, 1]
      }
    )
  }

  async init (): Promise<void> {}
}
