import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Buttons, Components, disableAll } from '#khaf/utility/Constants/Components.js'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { dontThrow } from '#khaf/utility/Don\'tThrow.js'
import { getMentions } from '#khaf/utility/Mentions.js'
import { parseStrToMs } from '#khaf/utility/ms.js'
import { plural } from '#khaf/utility/String.js'
import { bold } from '@discordjs/builders'
import { s } from '@sapphire/shapeshift'
import type { APIEmbed } from 'discord-api-types/v10'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

const schema = s.number.greaterThanOrEqual(0).greaterThanOrEqual(7)

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Softban a member (bans and instantly unbans them; clearing recent messages).\n' +
                'Will prompt you to confirm before soft-banning them.',
                '@user for a good reason',
                '@user bye!',
                '239566240987742220'
            ],
            {
                name: 'softbanprompt',
                folder: 'Moderation',
                aliases: ['softbnaprompt'],
                args: [1],
                guildOnly: true,
                permissions: [PermissionFlagsBits.BanMembers]
            }
        )
    }

    async init (message: Message<true>, { args, content }: Arguments): Promise<undefined | APIEmbed> {
        const user = await getMentions(message, 'users', content)
        if (!user) {
            return Embed.error('No user mentioned and/or an invalid ❄️ was used!')
        }

        const clear = typeof args[1] === 'string'
            ? Math.ceil(parseStrToMs(args[1])! / 86400000)
            : 7
        const reason = args.slice(args[1] && parseStrToMs(args[1]) ? 2 : 1).join(' ')

        const row = Components.actionRow([
            Buttons.approve('Yes'),
            Buttons.deny('No')
        ])

        const msg = await message.reply({
            embeds: [Embed.ok(`
            Are you sure you want to soft-ban ${user}? 
    
            This will delete ${clear} day${plural(clear)} worth of messages from them, but they ${bold('will be')} allowed to rejoin the guild.
            `)],
            components: [row]
        })

        const [buttonError, button] = await dontThrow(msg.awaitMessageComponent({
            filter: (interaction) =>
                ['approve', 'deny'].includes(interaction.customId) &&
                interaction.user.id === message.author.id &&
                interaction.message.id === msg.id,
            time: 20_000
        }))

        if (buttonError !== null) {
            return void msg.edit({
                embeds: [Embed.error(`Didn't get confirmation to soft-ban ${user}!`)],
                components: []
            })
        }

        if (button.customId === 'deny')
            return void button.update({
                embeds: [Embed.error(`${user} gets off lucky... this time (command was canceled)!`)],
                components: []
            })

        await button.deferUpdate()

        try {
            await message.guild.members.ban(user, {
                deleteMessageDays: schema.is(clear) ? clear : 7,
                reason
            })
            await message.guild.members.unban(user, `Khafra-Bot: softban by ${message.author.tag} (${message.author.id})`)
        } catch {
            return void button.editReply({
                embeds: [Embed.error(`${user} isn't bannable!`)],
                components: []
            })
        }

        return void button.editReply({
            embeds: [Embed.ok(`${user} has been soft-banned from the guild!`)],
            components: disableAll(msg)
        })
    }
}