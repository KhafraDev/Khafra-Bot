import { setTimeout } from 'node:timers/promises'

interface Options {
  interval: number
}

export abstract class Timer {
  public constructor (public options: Options) {}

  public abstract setInterval (): Promise<unknown>

  public abstract action (...items: unknown[]): Promise<void>

  public yieldEvery (ms: number, max = Infinity): {
    runs: number
    [Symbol.asyncIterator](): AsyncGenerator<number, void>
  } {
    return {
      runs: 0,
      async * [Symbol.asyncIterator](): AsyncGenerator<number, void> {
        while (this.runs < max) {
          await setTimeout(ms)
          yield this.runs++
        }
      }
    }
  }
}
