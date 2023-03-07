import { verify } from './verify.js'
import { handleCommand } from './Interactions/Commands/index.js'
import { handleSelectMenu } from './Interactions/SelectMenu/index.js'
import {
  InteractionType,
  InteractionResponseType,
  APIInteraction
} from 'discord-api-types/v10'

export const handleRequest = async (event: FetchEvent): Promise<Response> => {
  const { request } = event

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
  } else if (interaction.type === InteractionType.MessageComponent) {
    const promise = handleSelectMenu(interaction)
    event.waitUntil(promise)

    return Response.json(await promise)
  }

  return Response.json({ error: 'Unknown interaction type' }, {
    status: 401
  })
}
