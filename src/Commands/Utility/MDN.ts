import type { Arguments} from '#khaf/Command'
import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { fetchMDN as mdn } from '@khaf/mdn'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Search MDN for a phrase.',
                'Array.prototype.slice',
                'Number toLocaleString'
            ],
            {
                name: 'mdn',
                folder: 'Utility',
                args: [1]
            }
        )
    }

    async init (message: Message, { args }: Arguments): Promise<APIEmbed> {
        const results = await mdn(args.join(' '))

        if ('errors' in results) {
            const keys = Object.keys(results.errors)
            return Embed.error(
                // gets all errors and types of errors and joins them together.
                keys.map(k => results.errors[k].map(e => e.message).join('\n')).join('\n')
            )
        }

        if (results.documents.length === 0)
            return Embed.error('No results found!')

        const best = results.documents.sort((a, b) => b.score - a.score)

        return Embed.json({
            color: colors.ok,
            author: {
                name: 'Mozilla Development Network',
                icon_url: 'https://developer.mozilla.org/static/img/opengraph-logo.png'
            },
            description: best.map(doc =>
                `[${doc.title}](https://developer.mozilla.org/${doc.locale}/docs/${doc.slug})`
            ).join('\n'),
            footer: { text: 'Requested by ' + message.author.tag },
            timestamp: new Date().toISOString()
        })
    }
}