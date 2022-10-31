import { Command } from '#khaf/Command'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Search for an article on Wikipedia!',
        'Trojan Horse',
        'Batman 2022 (Movie)'
      ],
      {
        name: 'wikipedia',
        folder: 'Utility',
        args: [1],
        aliases: ['wiki'],
        guildOnly: true,
        ratelimit: 10
      }
    )
  }

  async init (): Promise<void> {}
}
