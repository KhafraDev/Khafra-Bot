import { Interactions } from '#khaf/Interaction'
import { AsyncQueue } from '#khaf/structures/AsyncQueue.js'
import { seconds } from '#khaf/utility/ms.js'
import { s } from '@sapphire/shapeshift'
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { env } from 'node:process'
import { stringify } from 'node:querystring'
import { setTimeout } from 'node:timers/promises'
import { request, type Dispatcher } from 'undici'

const queue = new AsyncQueue()
const queue2 = new AsyncQueue()

const nominatimSchema = s.object({
  place_id: s.number,
  licence: s.string.optional,
  license: s.string.optional,
  osm_type: s.string,
  osm_id: s.string.or(s.number),
  boundingbox: s.union(s.number.array, s.string.array),
  lat: s.string,
  lon: s.string,
  display_name: s.string,
  place_rank: s.number,
  category: s.string,
  type: s.string,
  importance: s.number
}).ignore.array.lengthEqual(1)

const timezoneSchema = s.object({
  status: s.string,
  message: s.string,
  countryCode: s.string,
  countryName: s.string,
  regionName: s.string,
  cityName: s.string,
  zoneName: s.string,
  abbreviation: s.string,
  gmtOffset: s.number,
  dst: s.string,
  zoneStart: s.number,
  zoneEnd: s.number,
  nextAbbreviation: s.string,
  timestamp: s.number,
  formatted: s.string
})

export class kInteraction extends Interactions {
  constructor () {
    const sc: RESTPostAPIApplicationCommandsJSONBody = {
      name: 'timezone',
      description: 'Gets the timezone of a location!',
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: 'location',
          description: 'Where to get the timezone of (city, country, zip code, etc.).',
          required: true
        },
        {
          type: ApplicationCommandOptionType.Boolean,
          name: '12hour',
          description: 'Choose 12 or 24 hour time, defaults to 12 hours.'
        }
      ]
    }

    super(sc, { defer: true })
  }

  async init (interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions> {
    const location = interaction.options.getString('location', true)
    const hour12 = interaction.options.getBoolean('12hour') ?? true

    await queue.wait()

    let resNom: Dispatcher.ResponseData | undefined
    const queryNom = stringify({ format: 'jsonv2', limit: '1', q: location })

    try {
      resNom = await request(
        `https://nominatim.openstreetmap.org/search.php?${queryNom}`,
        {
          headers: {
            // Provide a valid HTTP Referer or User-Agent identifying the application
            // (stock User-Agents as set by http libraries will not do).
            'User-Agent': 'Khafra-Bot (https://github.com/KhafraDev/Khafra-Bot)'
          }
        }
      )
    } finally {
      // No heavy uses (an absolute maximum of 1 request per second).
      void setTimeout(1000).then(
        () => queue.dequeue()
      )
    }

    const jNom: unknown = await resNom.body.json()

    if (!nominatimSchema.is(jNom)) {
      return {
        content: '❌ The location provided could not be found!',
        ephemeral: true
      }
    }

    await queue2.wait()

    let resTDB: Dispatcher.ResponseData | undefined
    const queryTDB = stringify({
      key: env.TIMEZONEDB,
      format: 'json',
      by: 'position',
      lat: jNom[0].lat,
      lng: jNom[0].lon
    })

    try {
      resTDB = await request(`https://api.timezonedb.com/v2.1/get-time-zone?${queryTDB}`)
    } finally {
      void setTimeout(1000).then(
        () => queue2.dequeue()
      )
    }

    const jTDB: unknown = await resTDB.body.json()

    if (!timezoneSchema.is(jTDB)) {
      return {
        content: '❌ Timezone couldn\'t be found, sorry.',
        ephemeral: true
      }
    }

    return {
      content: new Date(seconds(jTDB.timestamp - jTDB.gmtOffset)).toLocaleString(
        'en-US',
        {
          timeZone: jTDB.zoneName,
          hour12,
          dateStyle: 'long',
          timeStyle: 'long'
        }
      )
    }
  }
}
