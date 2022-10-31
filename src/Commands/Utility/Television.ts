import { Command } from '#khaf/Command'

export class kCommand extends Command {
  constructor () {
    super([
      'Get information about a tv show!'
    ], {
      name: 'tv',
      folder: 'Utility',
      args: [0],
      aliases: ['tele', 'television']
    })
  }

  async init (): Promise<void> {}
}
