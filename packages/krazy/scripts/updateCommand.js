import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'
import assert from 'node:assert'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import '../../../build/src/lib/Utility/load.env.js'

const rest = new REST().setToken(process.env.TOKEN)

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    path: {
      type: 'string'
    }
  }
})

const { command } = await import(pathToFileURL(resolve(values.path)))

assert(command.data)

const t = await rest.post(
  Routes.applicationCommands(process.env.BOTID),
  { body: command.data }
)

console.log({ t })