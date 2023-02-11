import { Command } from '#khaf/Command'
import { Kongregate } from '#khaf/utility/commands/SynergismStats'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { bold } from '@discordjs/builders'
import type { APIEmbed } from 'discord-api-types/v10'
import { request } from 'undici'

export class kCommand extends Command {
  constructor () {
    super(
      [
        'Get play stats about Synergism!'
      ],
      {
        name: 'synergismstats',
        folder: 'Fun',
        args: [0, 0],
        aliases: ['synergismstat']
      }
    )
  }

  async init (): Promise<APIEmbed> {
    const stats = await Kongregate()
    const quarkBonus = await request('https://synergism-quarks.khafra.workers.dev/')

    if (stats === null) {
      await quarkBonus.body.dump()
      return Embed.error('Failed to fetch the stats!')
    }

    const quarks = await quarkBonus.body.json() as { bonus: number }
    const [, average,, ratings] = stats.average_rating_with_count.split(/\s+/g)

    return Embed.json({
      color: colors.ok,
      title: 'Synergism Stats (Kongregate)',
      description: `
        ${bold('Plays')}: ${stats.gameplays_count.toLocaleString()}
        ${bold('Favorites')}: ${stats.favorites_count.toLocaleString()}
        Synergism averages ${bold(average)}/5 ⭐ from ${bold(ratings)} ratings!`,
      fields: [{ name: bold('Quark Bonus:'), value: `${quarks.bonus}%`, inline: true }]
    })
  }
}
