import { Interactions } from '#khaf/Interaction';
import { AsyncQueue } from '#khaf/structures/AsyncQueue.js';
import { ApplicationCommandOptionType, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ChatInputCommandInteraction } from 'discord.js';
import { env } from 'process';
import { setTimeout } from 'timers/promises';
import { request, type Dispatcher } from 'undici';
import { URLSearchParams } from 'url';

const queue = new AsyncQueue();
const queue2 = new AsyncQueue();

interface NominatimResponse {
    place_id: number
    licence: string
    osm_type: string
    osm_id: string
    boundingbox: number[]
    lat: string
    lon: string
    display_name: string
    place_rank: number
    category: string
    type: string
    importance: number
}

interface TimezoneDBResponse {
    status: string
    messag: string
    countryCode: string
    countryName: string
    regionName: string
    cityName: string
    zoneName: string
    abbreviation: string
    gmtOffset: number
    dst: `${number}`
    zoneStart: number
    zoneEnd: number
    nextAbbreviation: string
    timestamp: number
    formatted: string
}

const isValidResponse = (json: unknown): json is [NominatimResponse] =>
    Array.isArray(json) && json.length === 1;

export class kInteraction extends Interactions {
    constructor() {
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
        };

        super(sc, { defer: true });
    }

    async init(interaction: ChatInputCommandInteraction): Promise<string> {
        const location = interaction.options.getString('location', true);
        const hour12 = interaction.options.getBoolean('12hour') ?? true;

        await queue.wait();

        let resNom: Dispatcher.ResponseData | undefined;
        const queryNom = new URLSearchParams();
        queryNom.set('format', 'jsonv2');
        queryNom.set('limit', '1');
        queryNom.set('q', location);

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
            );
        } finally {
            // No heavy uses (an absolute maximum of 1 request per second).
            void setTimeout(1000).then(
                () => queue.dequeue()
            );
        }

        const jNom = await resNom.body.json() as [NominatimResponse];
        await queue2.wait();

        if (!isValidResponse(jNom)) {
            return '❌ The location provided could not be found!';
        }

        let resTDB: Dispatcher.ResponseData | undefined;
        const queryTDB = new URLSearchParams();
        queryTDB.set('key', env.TIMEZONEDB!);
        queryTDB.set('format', 'json');
        queryTDB.set('by', 'position');
        queryTDB.set('lat', jNom[0].lat);
        queryTDB.set('lng', jNom[0].lon);

        try {
            resTDB = await request(`https://api.timezonedb.com/v2.1/get-time-zone?${queryTDB}`);
        } finally {
            void setTimeout(1000).then(
                () => queue2.dequeue()
            );
        }

        const jTDB = await resTDB.body.json() as TimezoneDBResponse;

        return new Date((jTDB.timestamp - jTDB.gmtOffset) * 1000).toLocaleString(
            'en-US',
            {
                timeZone: jTDB.zoneName,
                hour12
            }
        );
    }
}