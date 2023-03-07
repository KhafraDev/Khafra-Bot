import { InteractionResponseType } from 'discord-api-types/v10'
import type { InteractionCommand } from '../../../types'

const clientId = '1036120664056279110'
const invite = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&scope=applications.commands`

export const command: InteractionCommand = {
  data: {
    name: 'invite',
    description: 'Add Krazy to your Discord server!'
  },

  run () {
    return Promise.resolve({
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: invite
      }
    })
  }
}
