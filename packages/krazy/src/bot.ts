import { verify } from './verify.js'
import { handleCommand } from './Commands/index.js'
import {
  InteractionType,
  InteractionResponseType,
  APIInteraction
} from 'discord-api-types/v10'

export const handleRequest = async (request: Request): Promise<Response> => {
  if (
    !request.headers.get('X-Signature-Ed25519') ||
    !request.headers.get('X-Signature-Timestamp')
  ) {
    return Response.json({ error: 'Invalid request' }, {
      status: 400
    })
  }
  
  const body = await request.text()

  if (!await verify(request, body)) {
    return Response.json({ error: 'Invalid request' }, {
      status: 401
    })
  }

  const interaction = JSON.parse(body) as APIInteraction

  if (interaction.type === InteractionType.Ping) {
    return Response.json({ type: InteractionResponseType.Pong })
  } else if (interaction.type === InteractionType.ApplicationCommand) {
    return Response.json(await handleCommand(interaction))
  }

  return Response.json({ error: 'Unknown interaction type' }, {
    status: 401
  })
}
