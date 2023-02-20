import { logger } from '#khaf/structures/Logger.js'
import { cwd } from '#khaf/utility/Constants/Path.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { seconds } from '#khaf/utility/ms.js'
import { isRedirect } from '#khaf/utility/util.js'
import { XMLParser, XMLValidator, type X2jOptionsOptional } from 'fast-xml-parser'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { request, type Dispatcher } from 'undici'

const config = createFileWatcher<typeof import('../../../package.json')>(join(cwd, 'package.json'))

interface RSSJSON<T> {
    rss: {
        channel?: {
            title: string
            link: string
            description: string
            ttl?: number
            'sy:updatePeriod': number
            'sy:updateFrequency': 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
            item: T[] | T
            [key: string]: unknown
        }
    }
}

interface AtomJSON<T> {
    feed: {
        id: string
        title: string
        updated: string
        entry: T[] | T
        [key: string]: unknown
    }
}

export class RSSReader<T> {
  #options: X2jOptionsOptional = {}
  #parser: XMLParser
  #url: string

  public readonly results = new Set<T>()
  public save = 10

  /**
   * @param loadFunction function to run after RSS feed has been fetched and parsed.
   * @param options RSS reader options
   */
  constructor (url: string, options: X2jOptionsOptional = {}) {
    this.#url = url
    this.#parser = new XMLParser(options)
    this.#options = options
  }

  /**
   * Very rarely, a network/server side error will occur. This function retries requests
   * up to 10 times before giving up.
   */
  async forceFetch (): Promise<Dispatcher.ResponseData | undefined> {
    for (let i = 0; i < 10; i++) {
      let ac: AbortController | undefined = new AbortController()
      const timeout = setTimeout(() => ac?.abort(), seconds(15)).unref()

      try {
        return await request(this.#url, {
          signal: ac.signal,
          headers: {
            'User-Agent': `Khafra-Bot (https://github.com/khafradev/Khafra-Bot, v${config.version})`
          }
        })
      } catch (e) {
        if ((e as Error).name === 'AbortError') {
          break
        }
      } finally {
        clearTimeout(timeout)
        ac = undefined
      }

      await delay(1000, undefined, { ref: false })
    }
  }

  async parse (): Promise<void> {
    const r = await this.forceFetch()
    const xml = await r?.body.text()

    const validXML = xml ? XMLValidator.validate(xml) : false
    if (typeof xml !== 'string' || validXML !== true) {
      if (typeof validXML !== 'boolean') {
        logger.warn(validXML.err, 'xml validation failed')
      }
      logger.warn(`xml parser: ${this.#url} return invalid xml`)
      return
    } else if (r !== undefined && isRedirect(r.statusCode)) {
      logger.info(r, `xml parser: ${this.#url} redirected you to ${r.headers.location}`)
    }

    // if the XML is valid, we can clear the old cache
    this.results.clear()
    const j = this.#parser.parse(xml, this.#options) as RSSJSON<T> | AtomJSON<T>

    if (!('rss' in j) && !('feed' in j)) {
      return
    }

    // A feed's TTL is not respected, defaulting to 12 hours.
    // https://www.rssboard.org/rss-draft-1#element-channel-ttl
    // https://web.resource.org/rss/1.0/modules/syndication/

    const i = 'rss' in j
      ? j.rss.channel?.item // RSS feed
      : j.feed.entry      // Atom feed

    if (Array.isArray(i)) {
      for (const item of i.slice(0, this.save)) {
        this.results.add(item)
      }
    } else if (i !== null && i !== undefined) {
      this.results.add(i)
    }
  }
}
