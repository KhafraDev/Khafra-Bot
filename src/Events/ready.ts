import { client } from '#khaf/Client'
import { Event } from '#khaf/Event'
import { logger } from '#khaf/structures/Logger/Logger.js'
import { yellow } from '#khaf/utility/Colors.js'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { dontThrow } from '#khaf/utility/Don\'tThrow.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { validSnowflake } from '#khaf/utility/Mentions.js'
import { Events } from 'discord.js'
import { join } from 'node:path'

const config = createFileWatcher({} as typeof import('../../config.json'), join(cwd, 'config.json'))

export class kEvent extends Event<typeof Events.ClientReady> {
    name = Events.ClientReady as const

    async init (): Promise<void> {
        const s = `Logged in at ${new Date()}`
        logger.log(yellow(s))

        if (typeof config.botOwner === 'string') {
            if (!validSnowflake(config.botOwner)) {
                return logger.warn('Logged in, configuration bot owner is not a valid Snowflake!')
            }

            const user = await client.users.fetch(config.botOwner)
            const [err] = await dontThrow(user.send({
                embeds: [Embed.ok(s)]
            }))

            if (err !== null) {
                logger.warn('Logged in! Could not send message to the bot owner.')
            }
        }
    }
}