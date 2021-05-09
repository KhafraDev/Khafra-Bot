import fetch, { Response } from 'node-fetch';

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

interface CovidCache {
    Province_State: string | null
    Country_Region: string
    Last_Update: string
    Confirmed: number
    Recovered: number
    Deaths: number
    Active: number
    Admin2: string | null
    Combined_Key: string
    People_Tested: number | null
}

const base = 'https://opendata.arcgis.com/datasets/1cb306b5331945548745a5ccd290188e_1.geojson';
export const cache = new Set<CovidCache>();

/**
 * Fetches COVID data from @see https://github.com/CSSEGISandData/COVID-19/
 */
export const fetchCOVIDStats = async () => {
    let r: Response | null = null;
    try {
        r = await fetch(base);
    } catch { 
        return; 
    }

    const j = await r.json() as JHURes;

    cache.clear();
    for (const feature of j.features) {
        cache.add({
            Province_State: feature.properties.Province_State,
            Country_Region: feature.properties.Country_Region,
            Last_Update: feature.properties.Last_Update,
            Confirmed: feature.properties.Confirmed,
            Recovered: feature.properties.Recovered,
            Deaths: feature.properties.Deaths,
            Active: feature.properties.Active,
            Admin2: feature.properties.Admin2,
            Combined_Key: feature.properties.Combined_Key,
            People_Tested: feature.properties.People_Tested
        });
    }

    return cache;
}

export const start = async () => {
    try { await fetchCOVIDStats() } catch {}
    return setInterval(async () => {
        try { await fetchCOVIDStats() } catch {}
    }, 60 * 1000 * 10);
}