import type { RestEvents } from '@discordjs/rest'
import type { ClientEvents } from 'discord.js'

type EventArguments<T> = T extends keyof ClientEvents
    ? ClientEvents[T]
    : T extends keyof RestEvents
        ? RestEvents[T]
        : never

export abstract class Event<
    T extends keyof ClientEvents | keyof RestEvents = keyof ClientEvents | keyof RestEvents
> {
    abstract name: `${T}`
    abstract init (...args: EventArguments<T>): Promise<void>
}