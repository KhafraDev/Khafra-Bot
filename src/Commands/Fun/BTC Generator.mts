import { setTimeout } from 'node:timers/promises'
import { s } from '@sapphire/shapeshift'
import type { Message } from 'discord.js'
import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { Embed, colors } from '#khaf/utility/Constants/Embeds.mjs'

const schema = s.number.safeInt.greaterThan(0)

export class kCommand extends Command {
  constructor() {
    super(['Generate free BTC!', '1000'], {
      name: 'btc-generator',
      folder: 'Fun',
      aliases: ['btcgenerator', 'free-btc', 'freebtc', 'btcgenerate'],
      args: [1, 1]
    })
  }

  async init(message: Message, { args }: Arguments): Promise<void> {
    const num = Number(args[0])
    const btc = schema.is(num) ? num : 1000

    const embed = Embed.json({
      color: colors.ok,
      title: `Generating ${btc.toLocaleString()} BTC!`,
      image: { url: 'https://i.imgur.com/8sIZySU.gif' }
    })

    const msg = await message.reply({ embeds: [embed] })

    await setTimeout(Math.floor(Math.random() * (10000 - 2500 + 1) + 2500), undefined, { ref: false })

    const embed2 = Embed.json({
      color: colors.ok,
      title: `Generated ${btc.toLocaleString()} BTC!`
    })

    if (msg.editable) {
      return void msg.edit({ embeds: [embed2] })
    }
  }
}
