import { Command } from '#khaf/Command'
import { cache, fetchHN } from '#khaf/utility/commands/HackerNews'
import { Embed } from '#khaf/utility/Constants/Embeds.js'
import type { APIEmbed } from 'discord-api-types/v10'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Fetch top articles from https://news.ycombinator.com/'
            ],
            {
                name: 'hackernews',
                folder: 'News',
                args: [0, 0],
                aliases: ['hn']
            }
        )
    }

    async init (): Promise<APIEmbed> {
        await fetchHN()

        if (cache.size === 0) {
            return Embed.error('Failed to fetch the articles!')
        }

        const stories = [...cache.values()]
        const list = stories
            .map((s,i) => `[${i+1}]: [${s.title}](${s.url})`)
            .join('\n')

        return Embed.ok(list)
    }
}