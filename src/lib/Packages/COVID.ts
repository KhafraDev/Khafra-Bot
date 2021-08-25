import { fetch } from 'undici';

interface JHURes {
    type: 'FeatureCollection'
    name: 'Coronavirus_COVID-19_Cases_V2'
    crs: {
        type: string
        properties: { [key: string]: string }
    }
    features: {
        type: 'Feature'
        properties: {
            OBJECTID: number
            Province_State: string | null
            Country_Region: string
            Last_Update: string
            Lat: number | null
            Long_: number | null
            Confirmed: number
            Recovered: number
            Deaths: number
            Active: number
            Admin2: string | null
            FIPS: null
            Combined_Key: string
            People_Tested: number | null
            UID: number
            ISO3: string
        }
        geometry: { type: 'Point', coordinates: number[] } | null
    }[]
}

const keys = [
    'Province_State', 
    'Country_Region', 
    'Lat', 
    'Long_', 
    'Confirmed', 
    'Recovered', 
    'Deaths', 
    'Active', 
    'Admin2', 
    'Combined_Key'
] as const;

type Good = Pick<JHURes['features'][0]['properties'], typeof keys[number]>;

type ReturnValue = { type: 'city', result: Good | undefined } | { type: 'country' | 'state,province', result: Good[] }

const cache = {
    countries: new Map<string, Good[]>(),
    provStates: new Map<string, string>(),
    cities: new Map<string, string[]>()
}

const fetchCOVIDStats = async () => {
    const r = await fetch('https://opendata.arcgis.com/datasets/1cb306b5331945548745a5ccd290188e_1.geojson');
    const j = await r.json() as JHURes;

    const countries = new Map<string, Good[]>();
    const provStates = new Map<string, string>();
    const cities = new Map<string, string[]>();

    for (const { properties } of j.features) {
        // we don't need a bunch of the properties, so let's remove them
        // properties in the keys array above are kept; all others are deleted
        for (const key in properties)
            if (!keys.includes(key as typeof keys[number]))
                delete properties[key as typeof keys[number]];

        const countryName = properties.Country_Region.toLowerCase();
        if (countries.has(countryName)) {
            const item = countries.get(countryName);
            countries.set(countryName, [...item!, properties]);

            // now we parse states/provinces
            const provStateName = properties.Province_State?.toLowerCase();
            const cityName = properties.Admin2?.toLowerCase();
            if (!provStateName) {
                continue;
            } else if (cities.has(provStateName)) {
                const all = cities.get(provStateName);
                if (Array.isArray(all) && typeof cityName === 'string') {
                    cities.set(provStateName, [ ...all, cityName ]);
                }
            } else {
                provStates.set(provStateName, countryName);
                if (cityName) cities.set(provStateName, [cityName]);
            }
        } else {
            countries.set(countryName, [properties]);
        }
    }

    cache.countries = countries;
    cache.provStates = provStates;
    cache.cities = cities;
}

export const start = async () => {
    try { await fetchCOVIDStats() } catch {}
    return setInterval(async () => {
        try { await fetchCOVIDStats() } catch {}
    }, 60 * 1000 * 10).unref();
}

// cities.get('new york') // string[] - list of cities in state/province
// provStates.get('new york') // us (country name)
// countries.get('us') // Good[]
/**
 * Parse and search for COVID results.
 * @param search string to search
 * @example
 * await fromCache('albany'); // null
 * await fromCache('albany, new york'); // result
 * await fromCache('new york'); // result
 * await fromCache('us'); // result[]
 */
export const fromCache = (search: string): ReturnValue | null => {
    search = search.toLowerCase();
    const { countries, provStates, cities } = cache;

    if (countries.has(search)) { // just country name
        return { type: 'country', result: countries.get(search)! };
    } else if (provStates.has(search)) { // just state/province name
        const countryName = provStates.get(search)!;
        const country = countries.get(countryName)!;

        return { 
            type: 'state,province', 
            result: country.filter(ps => ps.Province_State!.toLowerCase() === search) 
        };
    } else if (!search.includes(',')) { // no split between city/state or province
        return null;
    }

    const [cityName, stateProvName] = search.split(','); // albany, new york -> ['albany', ' new york']
    if (!cities.has(stateProvName.trim()))
        return null;

    // check if the city is actually a city in the state/province provided
    const city = cities
        .get(stateProvName.trim())!
        .find(name => name === cityName);
    
    if (!city)
        return null;   

    const countryName = provStates.get(stateProvName.trim())!;
    const country = countries.get(countryName)!;

    return {
        type: 'city',
        result: country.find(c => 
            c.Admin2?.toLowerCase() === city.toLowerCase() &&
            c.Province_State?.toLowerCase() === stateProvName.trim()
        )
    };
}