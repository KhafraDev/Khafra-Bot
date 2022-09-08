import { Interactions } from '#khaf/Interaction'
import { AsyncQueue } from '#khaf/structures/AsyncQueue.js'
import { ApplicationCommandOptionType, type RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10'
import type { ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js'
import { env } from 'node:process'
import { setTimeout } from 'node:timers/promises'
import { URLSearchParams } from 'node:url'
import { request, type Dispatcher } from 'undici'
import { s } from '@sapphire/shapeshift'

const queue = new AsyncQueue()
const queue2 = new AsyncQueue()

const nominatimSchema = s.object({
    place_id: s.number,
    license: s.string,
    osm_type: s.string,
    osm_id: s.string,
    boundingbox: s.number.array,
    lat: s.string,
    lon: s.string,
    display_name: s.string,
    place_rank: s.number,
    category: s.string,
    type: s.string,
    importance: s.number
}).array.lengthEqual(1)

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
    zoneStar: s.number,
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
        const queryNom = new URLSearchParams()
        queryNom.set('format', 'jsonv2')
        queryNom.set('limit', '1')
        queryNom.set('q', location)

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
        await queue2.wait()

        if (!nominatimSchema.is(jNom)) {
            return {
                content: '❌ The location provided could not be found!',
                ephemeral: true
            }
        }

        let resTDB: Dispatcher.ResponseData | undefined
        const queryTDB = new URLSearchParams()
        queryTDB.set('key', env.TIMEZONEDB!)
        queryTDB.set('format', 'json')
        queryTDB.set('by', 'position')
        queryTDB.set('lat', jNom[0].lat)
        queryTDB.set('lng', jNom[0].lon)

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
            content: new Date((jTDB.timestamp - jTDB.gmtOffset) * 1000).toLocaleString(
                'en-US',
                {
                    timeZone: jTDB.zoneName,
                    hour12
                }
            )
        }
    }
}