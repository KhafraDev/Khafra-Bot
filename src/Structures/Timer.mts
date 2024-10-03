import type { Client } from 'discord.js'
import { setTimeout } from 'node:timers/promises'

interface Options {
  client: Client
  interval: number
  maxRuns?: number
}

export abstract class Timer {
  options: Options

  constructor (options: Options) {
    this.options = options
  }

  abstract setInterval (): Promise<unknown>

  /**
   * Run once a timer has ended for an item. This ***MUST NOT*** throw an error.
   */
  abstract action (...items: unknown[]): Promise<void>

  yieldEvery (): {
    runs: number
    [Symbol.asyncIterator](): AsyncGenerator<number, void>
  } {
    const { interval, maxRuns = Infinity } = this.options

    return {
      runs: 0,
      async *[Symbol.asyncIterator] (): AsyncGenerator<number, void> {
        while (this.runs < maxRuns) {
          await setTimeout(interval)
          yield this.runs++
        }
      }
    }
  }
}
