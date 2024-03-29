import type { Command } from '#khaf/Command'
import type { Event } from '#khaf/Event'
import type {
  InteractionAutocomplete,
  Interactions,
  InteractionSubCommand,
  InteractionUserCommand
} from '#khaf/Interaction'
import { logger } from '#khaf/structures/Logger.mjs'
import type { Timer } from '#khaf/Timer'
import { assets, cwd } from '#khaf/utility/Constants/Path.mjs'
import { createFileWatcher } from '#khaf/utility/FileWatcher.mjs'
import { once } from '#khaf/utility/Memoize.mjs'
import type { RestEvents } from '@discordjs/rest'
import { type APIApplicationCommand, Routes } from 'discord-api-types/v10'
import { Client, type ClientEvents } from 'discord.js'
import assert from 'node:assert'
import { Buffer } from 'node:buffer'
import { type Dirent, existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { env } from 'node:process'
import { pathToFileURL } from 'node:url'

type DynamicImportCommand = Promise<{ kCommand: new(...args: unknown[]) => Command }>
type DynamicImportEvent = Promise<{ kEvent: new(...args: unknown[]) => Event }>
type DynamicImportAppCommand =
  | Promise<{ kInteraction: new() => Interactions }>
  | Promise<{ kSubCommand: new() => InteractionSubCommand }>
  | Promise<{ kAutocomplete: new() => InteractionAutocomplete }>
  | Promise<{ kUserCommand: new() => InteractionUserCommand }>

const config = createFileWatcher<typeof import('../../config.json')>(join(cwd, 'config.json'))
const toBase64 = (command: unknown): string => Buffer.from(JSON.stringify(command)).toString('base64')
const setInteractionIds = (commands: APIApplicationCommand[]): void => {
  for (const { name, id } of commands) {
    const cached = KhafraClient.Interactions.Commands.get(name)
    if (cached) cached.id = id
  }
}

export class KhafraClient extends Client {
  static Commands = new Map<string, Command>()
  static Events = new Map<keyof ClientEvents | keyof RestEvents, Event>()
  static Interactions = {
    Commands: new Map<string, Interactions>(),
    Subcommands: new Map<string, InteractionSubCommand>(),
    Autocomplete: new Map<string, InteractionAutocomplete>(),
    Context: new Map<string, InteractionUserCommand>()
  } as const
  static Timers = new Map<string, Timer>()

  /**
   * Walk up a directory and return the path for every file in the directory and sub-directories.
   */
  static walk (dir: string, fn: (path: string) => boolean): string[] {
    const ini = new Set<Dirent>(readdirSync(dir, { withFileTypes: true }))
    const files = new Set<string>()

    while (ini.size !== 0) {
      for (const d of ini) {
        const path = resolve(dir, d.name)
        ini.delete(d) // remove from set

        if (d.isDirectory()) {
          for (const f of readdirSync(path, { withFileTypes: true })) {
            f.name = resolve(path, f.name)
            ini.add(f)
          }
        } else if (d.isFile() && fn(d.name)) {
          files.add(path)
        }
      }
    }

    return [...files]
  }

  async loadCommands (): Promise<typeof KhafraClient.Commands> {
    const commands = KhafraClient.walk('build/src/Commands', (p) => p.endsWith('.mjs'))
    const importPromise = commands.map((command) => import(pathToFileURL(command).href) as DynamicImportCommand)
    const settled = await Promise.allSettled(importPromise)

    for (const fileImport of settled) {
      if (fileImport.status === 'rejected') {
        throw fileImport.reason
      } else {
        const kCommand = new fileImport.value.kCommand()

        KhafraClient.Commands.set(kCommand.settings.name.toLowerCase(), kCommand)
        // biome-ignore lint/complexity/noForEach:
        kCommand.settings.aliases?.forEach((alias) => KhafraClient.Commands.set(alias, kCommand))
      }
    }

    logger.info(`Loaded ${commands.length} commands!`)
    return KhafraClient.Commands
  }

  async loadEvents (): Promise<typeof KhafraClient.Events> {
    const events = KhafraClient.walk('build/src/Events', (p) => p.endsWith('.mjs'))
    const importPromise = events.map((event) => import(pathToFileURL(event).href) as DynamicImportEvent)
    const settled = await Promise.allSettled(importPromise)

    for (const fileImport of settled) {
      if (fileImport.status === 'rejected') {
        throw fileImport.reason
      } else {
        const kEvent = new fileImport.value.kEvent()
        assert(!KhafraClient.Events.has(kEvent.name))

        KhafraClient.Events.set(kEvent.name, kEvent)
      }
    }

    logger.info(`Loaded ${KhafraClient.Events.size} events!`)
    return KhafraClient.Events
  }

  async loadInteractions (): Promise<typeof KhafraClient.Interactions.Commands> {
    const interactionPaths = KhafraClient.walk('build/src/Interactions', (p) => p.endsWith('.mjs'))
    const importPromise = interactionPaths.map(
      (int) => import(pathToFileURL(int).href) as DynamicImportAppCommand
    )
    const imported = await Promise.allSettled(importPromise)

    const loaded: (Interactions | InteractionUserCommand)[] = []
    let loadedSubCommands = 0
    let loadedUserCommands = 0

    for (const interaction of imported) {
      if (interaction.status === 'fulfilled') {
        if ('kInteraction' in interaction.value) {
          const int = new interaction.value.kInteraction()
          KhafraClient.Interactions.Commands.set(int.data.name, int)
          loaded.push(int)
        } else if ('kSubCommand' in interaction.value) {
          const sub = new interaction.value.kSubCommand()
          KhafraClient.Interactions.Subcommands.set(`${sub.data.references}-${sub.data.name}`, sub)
          loadedSubCommands++
        } else if ('kAutocomplete' in interaction.value) {
          const autocomplete = new interaction.value.kAutocomplete()
          KhafraClient.Interactions.Autocomplete.set(
            `${autocomplete.data.references}-${autocomplete.data.name}`,
            autocomplete
          )
        } else if ('kUserCommand' in interaction.value) {
          const userCommand = new interaction.value.kUserCommand()
          KhafraClient.Interactions.Context.set(userCommand.data.name, userCommand)
          loaded.push(userCommand)
          loadedUserCommands++
        }
      } else {
        throw interaction.reason
      }
    }

    // If we have to deal with slash commands :(
    if (loaded.length !== 0) {
      const lastDeployedPath = assets('interaction_last_deployed.txt')
      const loadedCommands = loaded.map((command) => command.data)

      // https://discord.com/developers/docs/interactions/application-commands#get-global-application-commands
      // Global slash commands that have already been deployed.
      // We do not have to POST/PUT these, but PATCH them
      // if they have been updated.
      const existingSlashCommands = await this.rest.get(
        Routes.applicationCommands(config.botId)
      ) as APIApplicationCommand[]

      setInteractionIds(existingSlashCommands)

      // Lines to write to the last deployed file.
      const data: string[] = []

      // Commands that have already been deployed.
      // We need to PATCH these instead of overwriting.
      const previouslyDeployed: [string, string][] = existsSync(lastDeployedPath)
        ? readFileSync(lastDeployedPath, 'utf-8')
          .trim()
          .split(/\r?\n/g)
          .map((line) => line.split('|') as [string, string]) // "name|base64" -> ["name", "base64"]
        : []

      // If the file does not exist, meaning no commands
      // have been deployed yet.
      // We need the bulk overwrite endpoint.
      if (previouslyDeployed.length === 0) {
        logger.info(`Bulk creating ${loadedCommands.length} slash commands...`)
        // https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
        const overwritten = await this.rest.put(
          Routes.applicationCommands(config.botId),
          { body: loadedCommands }
        ) as APIApplicationCommand[]

        setInteractionIds(overwritten)

        data.push(...loadedCommands.map((l) => `${l.name}|${toBase64(l)}`))
      } else {
        // Filters out commands that have been deleted or renamed on our side.
        const deleted = existingSlashCommands.filter(
          (c) => !loadedCommands.find((n) => n.name === c.name)
        )

        for (const deletedCommand of deleted) {
          logger.info(`Deleting ${deletedCommand.name}!`)

          await this.rest.delete(
            Routes.applicationCommand(config.botId, deletedCommand.id)
          )
        }

        // Otherwise, we need to determine whether to
        // overwrite (create) a command or to update
        // an existing one instead.
        for (const current of loadedCommands) {
          const previous = previouslyDeployed.find(([n]) => n === current.name)
          const [deployedName, deployedBase64] = previous ?? []
          const existing = existingSlashCommands.find((command) => command.name === deployedName)

          const command = KhafraClient.Interactions.Commands.get(current.name)

          if (command?.options.deploy === false) {
            // If the command was already deployed, and then marked as 'should not deploy'.
            const deployedAlready = existingSlashCommands.find((c) => c.name === current.name)

            if (deployedAlready) {
              const { name, id } = deployedAlready

              logger.info(`Deleting ${name} - this command was deployed, but marked as "shouldn't deploy"!`)

              await this.rest.delete(Routes.applicationCommand(config.botId, id))
            }

            logger.info(`Skipping ${current.name} :)`)
            continue
          }

          // If the command has not been loaded on Discord's side,
          // or it hasn't previously been deployed on our side, we
          // need to on deploy it by POST request.
          if (!existing || !previous) {
            logger.info(`Deploying ${current.name} slash command!`)
            // https://discord.com/developers/docs/interactions/application-commands#create-global-application-command
            const added = await this.rest.post(
              Routes.applicationCommands(config.botId),
              { body: current }
            ) as APIApplicationCommand

            setInteractionIds([added])
          } else if (toBase64(current) !== deployedBase64) {
            // If the base64 for the deployed command and the current
            // command are different, the command must be updated.

            logger.info(`Updating ${deployedName} slash command!`)
            // https://discord.com/developers/docs/interactions/application-commands#edit-global-application-command
            const updated = await this.rest.patch(
              Routes.applicationCommand(config.botId, existing.id),
              { body: current }
            ) as APIApplicationCommand

            setInteractionIds([updated])
          }

          // The command already exists and has not been updated.
          // We do not have to do anything in this case.

          data.push(`${current.name}|${toBase64(current)}`)
        }
      }

      // Do not write to file if no commands were loaded!
      if (data.length > 0) {
        writeFileSync(lastDeployedPath, data.join('\n'))
      }
    }

    const loadedMessage = `Loaded ${loaded.length} interactions, `
      + `${loadedSubCommands} sub commands, `
      + `and ${loadedUserCommands} user commands!`

    logger.info(loadedMessage)
    return KhafraClient.Interactions.Commands
  }

  async startTimers (): Promise<void> {
    const timers = KhafraClient.walk(
      'build/src/Structures/Timers',
      (p) => p.endsWith('.mjs')
    )

    const importPromise = timers.map((timer) =>
      import(pathToFileURL(timer).href) as Promise<Record<string, new(client: Client) => Timer>>
    )
    const settled = await Promise.allSettled(importPromise)
    let loadedTimers = 0

    for (const imported of settled) {
      if (imported.status === 'fulfilled') {
        const key = Object.keys(imported.value)[0]
        const timer = new imported.value[key](this)

        loadedTimers++
        void timer.setInterval()
        KhafraClient.Timers.set(key, timer)
      } else {
        throw imported.reason
      }
    }

    logger.info(`Loaded ${loadedTimers}/${settled.length} timers!`)
  }

  init = once(async () => {
    const start = performance.now()
    this.rest.setToken(env.TOKEN) // token isn't set for us until we login
    await Promise.all([
      this.loadCommands(),
      this.loadEvents(),
      this.login(env.TOKEN),
      this.startTimers(),
      this.loadInteractions().catch((err) => logger.error(err, 'loadInteractions'))
    ])
    logger.info(`Started in ${((performance.now() - start) / 1000).toFixed(2)} seconds!`)
  })
}
