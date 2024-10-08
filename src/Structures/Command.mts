import { Cooldown } from '#khaf/cooldown/CommandCooldown.mjs'
import type { kGuild } from '#khaf/types/KhafraBot.js'
import { cwd } from '#khaf/utility/Constants/Path.mjs'
import { createFileWatcher } from '#khaf/utility/FileWatcher.mjs'
import { PermissionFlagsBits } from 'discord-api-types/v10'
import { type Message, type PermissionResolvable, PermissionsBitField, type Snowflake } from 'discord.js'
import { join } from 'node:path'

const config = createFileWatcher<typeof import('../../config.json')>(join(cwd, 'config.json'))

export interface Arguments {
  /** Default arguments, removes formatting (new lines, tabs, etc.) */
  readonly args: string[]
  /** Command used. */
  readonly commandName: string
  /** Text unformatted, removes mention+command with leading whitespace. */
  readonly content: string
}

interface ICommand {
  readonly help: string[]
  readonly permissions: bigint[]
  readonly settings: {
    readonly name: string
    readonly folder: string
    readonly args: [number, number?]
    /** Ratelimit in seconds, defaults to 5 */
    readonly ratelimit?: number
    readonly permissions?: PermissionResolvable
    readonly aliases?: string[]
    readonly guildOnly?: boolean
    readonly ownerOnly?: boolean
    readonly send?: boolean
  }
}

type HandlerReturn =
  | string
  | import('discord-api-types/v10').APIEmbed
  | import('discord.js').MessageReplyOptions
  | void
  | null

/** Permissions required to use a command */
const defaultPerms = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks
]

export abstract class Command implements ICommand {
  #perms = PermissionsBitField.Default
  help: string[]
  settings: ICommand['settings']

  readonly rateLimit: Cooldown

  constructor (
    help: string[],
    settings: ICommand['settings']
  ) {
    this.help = [...help]
    this.settings = settings

    this.rateLimit = new Cooldown(settings.ratelimit ?? 5)

    if (this.settings.permissions) {
      this.#perms = PermissionsBitField.resolve(this.settings.permissions)
    }
  }

  abstract init (
    message?: Message,
    args?: Arguments,
    settings?: kGuild | Partial<kGuild>
  ): Promise<HandlerReturn> | HandlerReturn

  get permissions (): bigint[] {
    return [...defaultPerms, this.#perms]
  }

  static isBotOwner (id: Snowflake): boolean {
    return Array.isArray(config.botOwner)
      ? config.botOwner.includes(id)
      : config.botOwner === id
  }
}
