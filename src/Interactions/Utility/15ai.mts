import { Interactions } from '#khaf/Interaction'
import { Buttons, Components } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { cwd } from '#khaf/utility/Constants/Path.mjs'
import { createFileWatcher } from '#khaf/utility/FileWatcher.mjs'
import { hyperlink } from '@discordjs/builders'
import { FifteenDotAI } from '@khaf/15.ai'
import type { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import { ApplicationCommandOptionType } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { join } from 'node:path'

type Characters = typeof import('../../../packages/15.ai/Characters.json')

const characters = createFileWatcher<Characters>(join(cwd, 'packages/15.ai/Characters.json'))
const keys = (Object.keys(characters) as (keyof typeof characters)[]).flatMap(k => characters[k])

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: '15ai',
      description: '15.ai: natural TTS.',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'voice',
          description: 'The character voice to use!',
          required: true,
          autocomplete: true
        },
        {
          type: ApplicationCommandOptionType.String,
          name: 'text',
          description: 'Text to convert to speech.',
          required: true
        }
      ]
    }

    super(sc, { defer: true })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const name = interaction.options.getString('voice', true).toLowerCase()
    const text = interaction.options.getString('text', true)
    const obj = keys.find(key => key.name.toLowerCase() === name)

    if (!obj) {
      return {
        content: '❌ No character with that name could be found! Use the autocomplete functionality!',
        ephemeral: true
      }
    } else if (text.length < 5) {
      return {
        content: '❌ Minimum of 5 characters required!',
        ephemeral: true
      }
    }

    const voice = await FifteenDotAI.getWav(
      obj.name,
      text,
      obj.emotions[0]
    )

    if (voice === null) {
      return {
        content: '❌ A server error occurred processing the TTS.',
        ephemeral: true
      }
    }

    let description = `${hyperlink('Visit 15.ai', 'https://15.ai')}\n`
    const embed = Embed.json({
      color: colors.ok,
      footer: { text: '🗣️ tts provided by 15.ai' }
    })

    for (let i = 0; i < voice.wavNames.length; i++) {
      const url = `https://cdn.15.ai/audio/${voice.wavNames[i]}`
      const confidence = `${(voice.scores[i] * 100).toFixed(2)}%`
      description += `${url} [Confidence: ${confidence}]\n`
    }

    embed.description = description

    return {
      embeds: [embed],
      components: [
        Components.actionRow([
          Buttons.link('Visit 15.ai', 'https://15.ai')
        ])
      ]
    }
  }
}
