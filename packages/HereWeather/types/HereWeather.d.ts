export interface HereResultSuccess {
    observations?: {
        location: Location[] 
    }
    feedCreation?: Date
    metric?: boolean
}

export interface HereResultError {
    Type: string
    Message: string[]
}

export type HereResult = HereResultSuccess | HereResultError;

type Location = {
    observation: LocationObservation,
    country: string,
    state: string,
    city: string,
    latitude: number,
    longitude: number,
    distance: number,
    timezone: number
}

export type LocationObservation = {
    daylight: string,
    description: string,
    skyInfo: string,
    skyDescription: string,
    temperature: string,
    temperatureDesc: string,
    comfort: string
    highTemperature: string
    lowTemperature: string
    humidity: string,
    dewPoint: string,
    precipitation1H: string,
    precipitation3H: string,
    precipitation6H: string,
    precipitation12H: string,
    precipitation24H: string,
    precipitationDesc: string,
    airInfo: string,
    airDescription: string,
    windSpeed: string,
    windDirection: string,
    windDesc: string,
    windDescShort: string,
    barometerPressure: string,
    barometerTrend: string,
    visibility: string,
    snowCover: string,
    icon: string,
    iconName: string,
    iconLink: string,
    ageMinutes: string,
    activeAlerts: string,
    country?: string,
    state?: string,
    city?: string,
    latitude: number,
    longitude: number,
    distance: number,
    elevation: number,
    utcTime: Date
}[]

export declare const weather: (q: string) => Promise<HereResult | null>;
