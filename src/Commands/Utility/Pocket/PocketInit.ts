import { Command } from '#khaf/Command'
import { sql } from '#khaf/database/Postgres.js'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { bold, inlineCode } from '@discordjs/builders'
import { Pocket } from '@khaf/pocket'
import { PermissionFlagsBits, type ComponentType } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

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
    pocket.redirect_uri = `https://discord.com/channels/${message.guild!.id}/${message.channel.id}`

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
        ['approve', 'deny'].includes(interaction.customId) &&
        interaction.user.id === message.author.id &&
        interaction.message.id === msg.id,
      time: 120_000
    }).catch(() => null)

    if (button === null) {
      if (msg.editable) {
        await msg.edit({
          embeds: [Embed.error('Canceled the command, took over 2 minutes.')],
          components: []
        })
      }

      return
    }

    await button.deferUpdate()

    if (button.customId === 'approve') {
      const token = await pocket.accessToken().catch(() => null)

      if (token == null) {
        return void await button.editReply({
          embeds: [Embed.error('Khafra-Bot wasn\'t authorized.')],
          components: []
        })
      }

      const { access_token, request_token, username } = pocket.toObject()

      if (!access_token || !request_token || !username) {
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
            ${access_token}::text,
            ${request_token}::text,
            ${username}::text
        ) ON CONFLICT (user_id, username) DO UPDATE SET 
            user_id = ${message.author.id}::text, 
            access_token = ${access_token}::text, 
            request_token = ${request_token}::text, 
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
