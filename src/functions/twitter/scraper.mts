import type { Buffer } from 'node:buffer'
import { AsyncQueue } from '@sapphire/async-queue'
import type { Browser } from 'playwright'
import { once } from '#khaf/utility/Memoize.mjs'
import { createDeferredPromise } from '#khaf/utility/util.mjs'

/**
 * @example
 * const scraper = new TwitterScraper()
 * const buffer = await scraper.getTweetAPILink('1703310705095533047')
 */
export class TwitterScraper {
  static browserInstance?: Browser

  #queue = new AsyncQueue()

  #openPage = once(async () => {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch({ headless: true })

    return await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.3 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
    })
  })

  async getTweetAPILink(id: string): Promise<{ url: string; bodyPromise: Promise<Buffer> }> {
    await this.#queue.wait({ signal: AbortSignal.timeout(30_000) })

    const promise = createDeferredPromise<{ url: string; bodyPromise: Promise<Buffer> }>()
    promise.promise.finally(() => this.#queue.shift())

    const page = await this.#openPage()

    page.on('response', (response) => {
      if (response.url().startsWith('https://cdn.syndication.twimg.com')) {
        promise.resolve({ url: response.url(), bodyPromise: response.body() })
      }
    })

    await page.goto(`https://platform.twitter.com/embed/Tweet.html?id=${id}`)

    return promise.promise
  }
}
