import { Command } from '#khaf/Command'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Search for a song on Spotify',
        'Bohemian Rhapsody',
        'Boston - More Than a Feeling',
        ''
      ],
      {
        name: 'spotify',
        folder: 'Utility',
        args: [0]
      }
    )
  }

  async init (): Promise<void> {}
}
