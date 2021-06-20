import fetch from 'undici-fetch';
import { URL } from 'url';

type Radius =
	| 1
	| 5
	| 10
	| 25
	| 50

interface FeatureCollection {
	type: 'FeatureCollection'
	query: [number]
	features: {
		id: string
		type: 'Feature'
		place_type: ['postcode']
		relevance: number
		properties: unknown
		text: string
		place_name: string
		bbox: [number, number, number, number]
		center: [/* Longitude */number, /* Latitude */number]
		geometry: { type: 'Point', coordinates: [number, number] }
		context: {
			id: string
			wikidata: string
			short_code?: string
			text: string
		}[]
	}[]
	attribution: string
}

interface VaccineLocations {
	providers: {
		guid: string
		name: string
		address1: string
		address2: string
		city: string
		state: string
		zip: string
		phone: string
		distance: number
		lat: number
		long: number
		in_stock: boolean
	}[]
	current_page: 1
	total_pages: 1
}

export const fetchLocation = async (zipcode: string) => {
	const mapbox = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${zipcode}.json`);
	mapbox.searchParams.set('country', 'us');
	mapbox.searchParams.set('types', 'postcode');
	mapbox.searchParams.set('autocomplete', 'false');
	mapbox.searchParams.set('access_token', 'pk.eyJ1IjoiaGVhbHRobWFwIiwiYSI6ImNrNnYzOXA3ajAxZDkzZHBqbW1tanNuc2EifQ.HR9Av0vkGQI7FyaTtlpmdw');
	
    const r = await fetch(mapbox);
    const j = await r.json() as FeatureCollection;

    return j;
}

export const fetchAppointments = async (zipcode: string, radius: Radius = 25) => {
	const { features } = await fetchLocation(zipcode);
	if (features.length === 0)
		return;

	const [long, lat] = features.shift()!.geometry.coordinates;

	const castlight = new URL('https://api.us.castlighthealth.com/vaccine-finder/v1/provider-locations/search');
	// ids of vaccines, https://api.us.castlighthealth.com/vaccine-finder/v1/medications
	castlight.searchParams.set('medicationGuids', '779bfe52-0dd8-4023-a183-457eb100fccc,a84fb9ed-deb4-461c-b785-e17c782ef88b,784db609-dc1f-45a5-bad6-8db02e79d44f');
	castlight.searchParams.set('lat', `${lat}`);
	castlight.searchParams.set('long', `${long}`);
	castlight.searchParams.set('radius', `${radius}`);

    const r = await fetch(castlight, {
        headers: {
            'Host': 'api.us.castlighthealth.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
            'Accept-Language': 'en-US,en;q=0.5',
            'Origin': 'https://www.vaccines.gov',
            'Connection': 'keep-alive'
        }
    });

	const j = await r.json() as VaccineLocations;
	return j;
}