import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { once } from '#khaf/utility/Memoize.js'
import { RSSReader } from '#khaf/utility/RSS.js'
import type { APIEmbed } from 'discord-api-types/v10'
import { decodeXML } from 'entities'

const settings = {
    rss: 'https://nbc-2.com/category/news/feed/',
    main: 'https://nbc-2.com',
    command: ['nbc2', 'nbc-2'],
    author: { name: 'NBC-2', iconURL: 'https://pbs.twimg.com/profile_images/1018899598029606912/lomPmdG3_400x400.jpg' }
} as const

interface INBC {
    title: string
    link: string
    'dc:creator': string
    pubDate: string
    category: string[]
    guid: string
    description: string
    'post-id': string
}

const rss = new RSSReader<INBC>()
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