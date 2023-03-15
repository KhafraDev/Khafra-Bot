import { strict as assert } from 'assert/strict'
import { test } from 'node:test'
import { Timer } from '../../build/src/Structures/Timer.mjs'

test('Timer doesn\'t run instantly', async (t) => {
  class SomeTimer extends Timer {
    constructor () {
      super({ interval: 2000, maxRuns: 1 })
    }

    async setInterval () {
      const last = performance.now()

      for await (const _ of this.yieldEvery()) {
        assert(performance.now() > last + 1000)
      }

      assert(true, 'timer ends because maxRuns is 1')
    }
  }

  const timer = new SomeTimer()
  await timer.setInterval()
})
