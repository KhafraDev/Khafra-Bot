import { Interactions } from '#khaf/Interaction'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { s } from '@sapphire/shapeshift'
import type { APIApplicationCommandOption, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { request } from 'undici'

interface StrawpollBody {
    poll: Partial<{
        title: string
        answers: string[]
        priv: boolean
        co: boolean
        ma: boolean
        mip: boolean
        enter_name: boolean
        deadline: Date | undefined
        only_reg: boolean
        vpn: boolean
        captcha: boolean
    }>
}

const schema = s.object({
  admin_key: s.string,
  content_id: s.string,
  success: s.number.greaterThanOrEqual(0).lessThanOrEqual(1)
})

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'strawpoll',
      description: 'Create a poll on strawpoll.com!',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'title',
          description: 'The poll\'s title.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'choice-1',
          description: 'The first choice to add to the poll.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'choice-2',
          description: 'The second choice to add to the poll.',
          required: true
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'private',
          description: 'If the poll should be private, defaults to true.'
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'allow-comments',
          description: 'If users should be allowed to leave comments, defaults to true.'
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'multiple-answers',
          description: 'If users can leave multiple answers, defaults to false.'
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'multiple-votes-per-ip',
          description: 'If users can vote multiple times, default to false.'
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'name',
          description: 'If users are required to leave their name, defaults to false.'
        },
        // TODO: add date option once the api is updated
        /*{
            type: ApplicationCommandOptionType.String,
            name: 'date',
            description: 'If the poll should be private, defaults to true.'
        },*/
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'only-registered',
          description: 'If the poll should only allow registered users to vote, defaults to false.'
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'vpn',
          description: 'If the poll should allow VPN users to vote, defaults to false.'
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: 'captcha',
          description: 'If the poll requires a captcha to vote, defaults to true.'
        },
        ...Array.from({ length: 14 }, (_, i): APIApplicationCommandOption => ({
          type: ApplicationCommandOptionType.String,
          name: `choice-${i + 3}`,
          description: `Optional choice #${i + 3} to add to the poll.`
        }))
      ]
    }

    super(sc)
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const answers: string[] = []

    for (let i = 1; i <= 16; i++) {
      const option = interaction.options.getString(`choice-${i}`, i <= 2)

      if (option) {
        answers.push(option)
      }
    }

    const poll: StrawpollBody['poll'] = {
      title: interaction.options.getString('title', true),
      answers: answers,
      priv: interaction.options.getBoolean('private') ?? true,
      co: interaction.options.getBoolean('allow-comments') ?? false,
      ma: interaction.options.getBoolean('multiple-answers') ?? false,
      mip: interaction.options.getBoolean('multiple-votes-per-ip') ?? false,
      enter_name: interaction.options.getBoolean('name') ?? false,
      only_reg: interaction.options.getBoolean('only-registered') ?? false,
      vpn: interaction.options.getBoolean('vpn') ?? false,
      captcha: interaction.options.getBoolean('captcha') ?? true
    }

    const { body } = await request('https://strawpoll.com/api/poll', {
      method: 'POST',
      body: JSON.stringify({ poll } as StrawpollBody)
    })

    const j: unknown = await body.json()

    if (!schema.is(j) || j.success === 0) {
      return {
        content: 'Failed to create the poll. This is not an issue with the bot.',
        ephemeral: true
      }
    }

    return {
      embeds: [
        Embed.ok(`
        Your Strawpoll can be found at:
        https://strawpoll.com/${j.content_id}
        `)
      ]
    }
  }
}
