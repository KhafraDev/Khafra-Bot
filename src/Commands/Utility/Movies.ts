import { Command } from '#khaf/Command'

export class kCommand extends Command {
  constructor () {
    super([
      'Get information about a movie!'
    ], {
      name: 'movies',
      folder: 'Utility',
      args: [0],
      aliases: ['movie', 'tmdb']
    })
  }

  async init (): Promise<void> {}
}
