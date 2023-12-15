import type { RestEvents } from '@discordjs/rest'
import type { ClientEvents } from 'discord.js'

type EventArguments<T> = T extends keyof ClientEvents ? ClientEvents[T]
  : T extends keyof RestEvents ? RestEvents[T]
  : never

export interface Event<T = keyof ClientEvents | keyof RestEvents> {
  name: T
  init(...args: EventArguments<T>): Promise<void>
}
