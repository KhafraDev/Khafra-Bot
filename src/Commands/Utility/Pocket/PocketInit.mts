import { Command } from '#khaf/Command'
import { sql } from '#khaf/database/Postgres.mjs'
import { Pocket } from '#khaf/functions/pocket/Pocket.mjs'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.mjs'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.mjs'
import { minutes } from '#khaf/utility/ms.mjs'
import { bold, inlineCode } from '@discordjs/builders'
import { type ComponentType, PermissionFlagsBits } from 'discord-api-types/v10'
import { channelLink, type Message } from 'discord.js'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Pocket: Start the process of authorizing your Pocket account.'
      ],
      {
        name: 'pocketinit',
        folder: 'Pocket',
        args: [0, 0],
        ratelimit: 300,
        permissions: [
          PermissionFlagsBits.AddReactions,
          PermissionFlagsBits.ManageEmojisAndStickers
        ]
      }
    )
  }

  async init (message: Message): Promise<undefined> {
    const pocket = new Pocket()
    pocket.redirect_uri = channelLink(message.channel.id)

    await pocket.requestCode()

    const embed = Embed.json({
      color: colors.ok,
      description: `
        Authorize Khafra-Bot using the link below! 
        
        [Click Here](${pocket.requestAuthorization})!
        After authorizing click the approve ✅ button, or click the cancel ❌ button to cancel! 
        
        ${bold('Command will be canceled after 2 minutes automatically.')}`,
      title: 'Pocket'
    })

    const row = Components.actionRow([
      Buttons.approve('Approve'),
      Buttons.deny('Cancel')
    ])

    const msg = await message.reply({
      embeds: [embed],
      components: [row]
    })

    const button = await msg.awaitMessageComponent<ComponentType.Button>({
      filter: (interaction) =>
        ['approve', 'deny'].includes(interaction.customId)
        && interaction.user.id === message.author.id
        && interaction.message.id === msg.id,
      time: minutes(2)
    }).catch(() => null)

    if (button === null) {
      if (msg.editable) {
        await msg.edit({
          embeds: [
            Embed.error('Canceled the command, took over 2 minutes. This is a limit set by Pocket, not by me.')
          ],
          components: []
        })
      }

      return
    }

    await button.deferUpdate()

    if (button.customId === 'approve') {
      const token = await pocket.getAccessToken().catch(() => null)

      if (token === null) {
        return void await button.editReply({
          embeds: [Embed.error('Khafra-Bot wasn\'t authorized.')],
          components: []
        })
      }

      const { accessToken, requestToken, username } = pocket

      if (!accessToken || !requestToken || !username) {
        return void await button.editReply({
          embeds: [Embed.error('An unexpected issue occurred.')],
          components: []
        })
      }

      // Insert into the table, if username or user_id is already in,
      // we will update the values. Useful if user unauthorized Khafra-Bot.
      await sql`
        INSERT INTO kbPocket (
          user_id, access_token, request_token, username
        ) VALUES (
          ${message.author.id}::text,
          ${accessToken}::text,
          ${requestToken}::text,
          ${username}::text
        ) ON CONFLICT (user_id, username) DO UPDATE SET 
          user_id = ${message.author.id}::text, 
          access_token = ${accessToken}::text, 
          request_token = ${requestToken}::text, 
          username = ${username}::text
        ;
      `

      return void button.editReply({
        embeds: [
          Embed.ok(`
          You have authorized ${message.guild!.members.me}!

          Try adding an article with ${inlineCode('pocketadd')} now. 👍
          `)
        ],
        components: disableAll(msg)
      })
    }

    return void button.editReply({
      embeds: [Embed.error('Khafra-Bot wasn\'t authorized, command was canceled!')],
      components: disableAll(msg)
    })
  }
}
