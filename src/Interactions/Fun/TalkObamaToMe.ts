import { Interactions } from '#khaf/Interaction'
import { talkObamaToMe } from '#khaf/utility/commands/TalkObamaToMe'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'talkobamatome',
      description: 'Have Obama say something.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'sentence',
          description: 'The sentence that you want Obama to speak.',
          required: true
        }
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const sentence = interaction.options.getString('sentence', true)
    const obama = await talkObamaToMe(sentence.slice(0, 280))

    return {
      content: obama
    }
  }
}
