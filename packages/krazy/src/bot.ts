import { verify } from './verify.js'
import { handleCommand } from './Commands/index.js'
import {
  InteractionType,
  InteractionResponseType,
  type APIApplicationCommandInteraction,
  type APIPingInteraction
} from 'discord-api-types/v10'

export const handleRequest = async (request: Request): Promise<Response> => {
  if (
    !request.headers.get('X-Signature-Ed25519') ||
    !request.headers.get('X-Signature-Timestamp')
  ) {
    return Response.json({ error: 'Invalid request' }, {
      status: 400
    })
  } else if (!await verify(request)) {
    return Response.json({ error: 'Invalid request' }, {
      status: 401
    })
  }

  const interaction = await request.json<APIApplicationCommandInteraction | APIPingInteraction>()

  if (interaction.type === InteractionType.Ping) {
    return Response.json({
      type: InteractionResponseType.Pong
    })
  }

  return Response.json(await handleCommand(interaction, request))
}
