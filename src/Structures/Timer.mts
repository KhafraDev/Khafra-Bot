import { setTimeout } from 'node:timers/promises'

interface Options {
  interval: number
  maxRuns?: number
}

export abstract class Timer {
  public constructor (public options: Options) {}

  public abstract setInterval (): Promise<unknown>

  public abstract action (...items: unknown[]): Promise<void>

  public yieldEvery (): {
    runs: number
    [Symbol.asyncIterator](): AsyncGenerator<number, void>
  } { // eslint-disable-line indent
    const { interval, maxRuns = Infinity } = this.options

    return {
      runs: 0,
      async * [Symbol.asyncIterator](): AsyncGenerator<number, void> {
        while (this.runs < maxRuns) {
          await setTimeout(interval)
          yield this.runs++
        }
      }
    }
  }
}
