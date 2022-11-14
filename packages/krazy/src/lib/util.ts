export const time = (unix: Date, format: string): string =>
  `<t:${Math.floor(unix.getTime() / 1000)}:${format}>`

/*
export const deferInteraction = async (interaction: APIApplicationCommandInteraction) => {
  // https://discord.com/developers/docs/interactions/receiving-and-responding#create-interaction-response
  const path = Routes.interactionCallback(interaction.id, interaction.token)
  const response = await fetch(`${baseAPI}${path}`, {
    method: 'POST',
    body: JSON.stringify({
      type: InteractionResponseType.DeferredChannelMessageWithSource
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return response.status === 204
}
*/
