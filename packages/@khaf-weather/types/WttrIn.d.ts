type WttrValueArray = { value: string }[]

export interface WttrCurrentCondition {
    FeelsLikeC: string
    FeelsLikeF: string
    cloudcover: string
    humidity: string
    localObsDateTime: string
    observation_time: string
    precipInches: string
    precipMM: string
    pressure: string
    pressureInches: string
    temp_C: string
    temp_F: string
    uvIndex: string
    visibility: string
    visibilityMiles: string
    weatherCode: string
    weatherDesc: WttrValueArray
    weatherIconUrl: WttrValueArray
    winddir16Point: string
    winddirDegree: string
    windspeedKmph: string
    windspeedMiles: string
}

export interface WttrNearestArea {
    areaName: WttrValueArray
    country: WttrValueArray
    latitude: string
    longitude: string
    population: string
    region: WttrValueArray
    weatherUrl: WttrValueArray
}

export interface WttrWeather {
    astronomy: {
        moon_illumination: string
        moon_phase: string
        moonrise: string
        moonset: string
        sunrise: string
        sunset: string
    }[]
    avgtempC: string
    avgtempF: string
    date: string
    hourly: {
        DewPointC: string
        DewPointF: string
        FeelsLikeC: string
        FeelsLikeF: string
        HeatIndexC: string
        HeatIndexF: string
        WindChillC: string
        WindChillF: string
        WindGustKmph: string
        WindGustMiles: string
        chanceoffog: string
        chanceoffrost: string
        chanceofhightemp: string
        chanceofovercast: string
        chanceofrain: string
        chanceofremdry: string
        chanceofsnow: string
        chanceofsunshine: string
        chanceofthunder: string
        chanceofwindy: string
        cloudcover: string
        humidity: string
        precipInches: string
        precipMM: string
        pressure: string
        pressureInches: string
        tempC: string
        tempF: string
        time: string
        uvIndex: string
        visibility: string
        visibilityMiles: string
        weatherCode: string
        weatherDesc: WttrValueArray
        weatherIconUrl: WttrValueArray
        winddir16Point: string
        winddirDegree: string
        windspeedKmph: string
        windspeedMiles: string
    }[]
    maxtempC: string
    maxtempF: string
    mintempC: string
    mintempF: string
    sunHour: string
    totalSnow_cm: string
    uvIndex: string
}

export interface WttrInResult {
    current_condition: WttrCurrentCondition[]
    nearest_area: WttrNearestArea[]
    request: {
        query: string
        type: string
    }[]
    weather: WttrWeather[]
}