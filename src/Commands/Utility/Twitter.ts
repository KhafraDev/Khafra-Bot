import { Command } from '#khaf/Command'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get direct links to media in Tweets!',
        'https://twitter.com/expo_con/status/1362620733570998274'
      ],
      {
        name: 'twitter',
        folder: 'Utility',
        args: [1, 1],
        aliases: ['twit', 'twitterdownload', 'twitdl', 'twitdownload']
      }
    )
  }

  async init (): Promise<void> {}
}
