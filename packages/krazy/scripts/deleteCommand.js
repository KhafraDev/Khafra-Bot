import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'
import { strict as assert } from 'node:assert'
import { parseArgs } from 'node:util'
import '../../../build/src/lib/Utility/load.env.js'

const rest = new REST().setToken(process.env.TOKEN)

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    name: {
      type: 'string'
    }
  }
})

const all = await rest.get(Routes.applicationCommands(process.env.BOTID))
const command = all.find(command => command.name === values.name.toLowerCase())

assert(command)

const t = await rest.delete(Routes.applicationCommand(process.env.BOTID, command.id))

console.log({ t })
