import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'

const settings = {
    rss: 'https://www.eff.org/rss/updates.xml',
    main: 'https://eff.org. Donate @ https://supporters.eff.org/donate/join-eff-today',
    command: ['eff'],
    author: { name: 'EFF', iconURL: 'https://www.eff.org/files/2018/06/14/eff_monogram-primary-red.png' }
} as const

interface IEFF {
    title: string
    link: string
    description: string
    pubDate: string
    guid: string
    category: string[]
    'dc:creator': string
    enclosure: string
}

const rss = new RSSReader<IEFF>()
const cache = once(async () => rss.cache(settings.rss))

export class kCommand extends Command {
    constructor () {
        super(
            [
                `Get the latest articles from ${settings.main}!`
            ],
            {
                name: settings.command[0],
                folder: 'News',
                args: [0, 0],
                aliases: settings.command.slice(1)
            }
        )
    }

    async init (): Promise<APIEmbed> {
        const state = await cache()

        if (state === null) {
            return Embed.error('Try again in a minute!')
        }

        if (rss.results.size === 0) {
            return Embed.error('An unexpected error occurred!')
        }

        const posts = [...rss.results.values()]
        return Embed.json({
            color: colors.ok,
            description: posts
                .map((p, i) => `[${i+1}] [${decodeXML(p.title)}](${p.link})`)
                .join('\n')
                .slice(0, 2048),
            author: settings.author
        })
    }
}