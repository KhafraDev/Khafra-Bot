import { handleCommand } from '#/commands/Commands/index.mjs'
import { handleSelectMenu } from '#/commands/SelectMenu/index.mjs'
import { verify } from '#/verify.mjs'
import { type APIInteraction, InteractionResponseType, InteractionType } from 'discord-api-types/v10'

interface Env {
  // wrangler secret put publicKey
  publicKey: string
}

export default {
  async fetch (request, env, ctx): Promise<Response> {
    if (
      !request.headers.get('X-Signature-Ed25519')
      || !request.headers.get('X-Signature-Timestamp')
    ) {
      return Response.json({ error: 'Invalid request' }, {
        status: 400
      })
    }

    const body = await request.text()

    if (!await verify(request, body, env.publicKey)) {
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
      ctx.waitUntil(promise)

      return Response.json(await promise)
    }

    return Response.json({ error: 'Unknown interaction type' }, {
      status: 401
    })
  }
} satisfies ExportedHandler<Env>
