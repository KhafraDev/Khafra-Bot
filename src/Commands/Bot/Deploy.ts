import { KhafraClient, rest } from '#khaf/Bot'
import type { Arguments } from '#khaf/Command'
import { Command } from '#khaf/Command'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { inlineCode } from '@discordjs/builders'
import { Routes } from 'discord-api-types/v10'
import type { Message } from 'discord.js'
import { join } from 'node:path'

const config = createFileWatcher(
	{} as typeof import('../../../config.json'),
	join(cwd, 'config.json')
)

export class kCommand extends Command {
    constructor () {
        super([
            'Deploy an owner-only interaction!'
        ], {
            name: 'deploy',
            folder: 'Bot',
            args: [1, 1],
            ratelimit: 0,
            ownerOnly: true
        })
    }

    async init (_message: Message, { args }: Arguments): Promise<string> {
        const commandName = args[0].toLowerCase()
        const command = KhafraClient.Interactions.Commands.get(commandName)

        if (!command) {
            return `❌ Command "${inlineCode(commandName)}" does not exist, idiot.`
        }

        // https://discord.com/developers/docs/interactions/application-commands#create-guild-application-command
        await rest.post(
            Routes.applicationGuildCommands(config.botId, config.guildId),
            { body: command.data }
        )

        return `✅ Command "${inlineCode(commandName)}" has been deployed in ${inlineCode(config.botOwner)}!`
    }
}