import { Command } from '#khaf/Command'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get information about different CryptoCurrencies! Kill the environment!',
        'btc', 'bitcoin', 'BAT'
      ],
      {
        name: 'crypto',
        folder: 'Utility',
        args: [1], // some symbols are multi-worded
        aliases: ['cc']
      }
    )
  }

  async init (): Promise<void> {}
}
