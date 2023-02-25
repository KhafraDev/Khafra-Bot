import { client } from '#khaf/Client'
import { sql } from '#khaf/database/Postgres.js'
import { logger } from '#khaf/structures/Logger.js'
import { Timer } from '#khaf/Timer'
import type { Giveaway } from '#khaf/types/KhafraBot.js'
import { isText } from '#khaf/utility/Discord.js'
import { seconds } from '#khaf/utility/ms.js'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import type { User } from 'discord.js'

export class GiveawayTimer extends Timer {
  constructor () {
    super({ interval: seconds(30) })
  }

  async setInterval (): Promise<void> {
    for await (const _ of this.yieldEvery()) {
      // Delete all ended giveaways that are older than a week old.
      // This gives users a week to re-roll.
      await sql`
        DELETE FROM kbGiveaways
        WHERE kbGiveaways.endDate <= now() - '7 days'::interval
      `

      // Select all giveaways between (-7 days, now). At this point,
      // all older giveaways have been deleted.
      const rows = await sql<Giveaway[]>`
				SELECT * FROM kbGiveaways 
				WHERE
          kbGiveaways.endDate < CURRENT_TIMESTAMP AND
          kbGiveaways."didEnd" = FALSE;
			`

      if (rows.length !== 0) {
        const ids: string[] = []

        for (const row of rows) {
          void this.action(row)
          ids.push(row.id)
        }

        await sql`
          UPDATE kbGiveaways SET
            "didEnd" = true
          WHERE id IN ${sql(ids)}
        `
      }
    }
  }

  async action (giveaway: Giveaway): Promise<void> {
    // If the timer is running before the client is logged in.
    if (!client.isReady()) return

    try {
      const guild = await client.guilds.fetch(giveaway.guildid)
      const channel = await guild.channels.fetch(giveaway.channelid)
      const me = guild.members.me ?? await guild.members.fetchMe()

      if (!isText(channel)) return
      if (!channel.permissionsFor(me).has(PermissionFlagsBits.ReadMessageHistory)) return

      const message = await channel.messages.fetch(giveaway.messageid)
      const reactions = message.reactions.cache

      if (message.author.id !== client.user.id) return
      if (!reactions.has('🎉')) {
        const emoji = message.reactions.resolve('🎉')

        if (emoji) {
          await emoji.users.fetch()
        }
      }

      const { users, count } = reactions.get('🎉')!
      if (users.cache.size !== count) {
        await users.fetch()
      }

      const winners: User[] = []
      if (count > giveaway.winners) { // bot react counts so the length must be greater
        while (winners.length < giveaway.winners) {
          const random = users.cache.random()
          if (!random) break
          if (random.bot) continue
          if (winners.some(u => u.id === random.id)) continue

          winners.push(random)
        }
      } else if (count === 1 && users.cache.first()!.id === client.user.id) { // no one entered
        if (message.editable) {
          return void message.edit({
            content: 'No one entered the giveaway!'
          })
        } else {
          return void channel.send({
            content: 'No one entered the giveaway!'
          })
        }
      } else if (count <= giveaway.winners) { // less entered than number of winners
        for (const user of users.cache.values()) {
          if (user.bot) continue
          winners.push(user)
        }
      }

      if (!message.editable) {
        if (giveaway.winners !== 1 && winners.length > 1) {
          return void channel.send({
            content: `Giveaway ended! The winners are ${winners.join(', ')}! 🎉`
          })
        } else {
          return void channel.send({
            content: `Giveaway ended! The winner is ${winners[0]}! 🎉`
          })
        }
      } else {
        if (giveaway.winners !== 1 && winners.length > 1) {
          return void message.edit({
            content: `Giveaway has ended, the winners are ${winners.join(', ')}! 🎉`
          })
        } else {
          return void message.edit({
            content: `Giveaway has ended, the winner is ${winners[0]}! 🎉`
          })
        }
      }
    } catch (e) {
      logger.error(e, 'giveaway error')
    } finally {
      logger.info(giveaway, 'giveaway finished')
    }
  }
}
