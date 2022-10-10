import type { Arguments} from '#khaf/Command'
import { Command } from '#khaf/Command'
import { colors, Embed } from '#khaf/utility/Constants/Embeds.js'
import { bold, inlineCode, time } from '@discordjs/builders'
import { npm } from '@khaf/npm'
import type { APIEmbed } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { performance } from 'node:perf_hooks'

export class kCommand extends Command {
    constructor () {
        super(
            [
                'Search NPM\'s registry for a package',
                'node-fetch latest', 'typescript'
            ],
            {
                name: 'npm',
                folder: 'Utility',
                aliases: ['npmjs'],
                args: [1, 2]
            }
        )
    }

    async init (_message: Message, { args }: Arguments): Promise<string | APIEmbed> {
        const [name, version = 'latest'] = args
        const p = await npm(name)

        if ('code' in p) {
            return '❌ No package with that name was found!'
        } else if ('error' in p) {
            return `❌ An unexpected error has occurred: ${inlineCode(p.error)}!`
        }

        const ver = version.startsWith('v') ? version.slice(1) : version
        const dist = p.versions[p['dist-tags'][ver] ?? p['dist-tags']['latest']]

        const maintainers = dist.maintainers
            .slice(0, 10)
            .map(u => u.name)
            .join(', ')

        return Embed.json({
            color: colors.ok,
            author: {
                name: 'NPM',
                icon_url: 'https://avatars0.githubusercontent.com/u/6078720?v=3&s=400',
                url: 'https://npmjs.com/'
            },
            description: `
            [${dist.name}](https://npmjs.com/package/${dist.name})
            ${inlineCode(p.description.slice(0, 2000))}
            `,
            fields: [
                { name: bold('Version:'), value: dist.version, inline: true },
                { name: bold('License:'), value: dist.license, inline: true },
                { name: bold('Author:'), value: p.author?.name ?? 'N/A', inline: true },
                {
                    name: bold('Last Modified:'),
                    value: time(new Date(p.time?.modified ?? performance.now()), 'f'),
                    inline: true
                },
                { name: bold('Published:'), value: time(new Date(p.time?.created ?? performance.now())), inline: true },
                { name: bold('Homepage:'), value: p.homepage ?? 'None', inline: true },
                { name: bold('Maintainers:'), value: maintainers }
            ]
        })
    }
}