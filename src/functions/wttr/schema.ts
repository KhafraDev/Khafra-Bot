import { s } from '@sapphire/shapeshift'

export const weatherSchema = s.object({
  current_condition: s.object({
    FeelsLikeC: s.string,
    FeelsLikeF: s.string,
    cloudcover: s.string,
    humidity: s.string,
    localObsDateTime: s.string,
    observation_time: s.string,
    precipInches: s.string,
    precipMM: s.string,
    pressure: s.string,
    pressureInches: s.string,
    temp_C: s.string,
    temp_F: s.string,
    uvIndex: s.string,
    visibility: s.string,
    visibilityMiles: s.string,
    weatherCode: s.string,
    weatherDesc: s.object({
      value: s.string
    }).ignore.array,
    weatherIconUrl: s.object({
      value: s.string
    }).ignore.array,
    winddir16Point: s.string,
    winddirDegree: s.string,
    windspeedKmph: s.string,
    windspeedMiles: s.string
  }).ignore.array,
  nearest_area: s.object({
    areaName: s.object({
      value: s.string
    }).ignore.array,
    country: s.object({
      value: s.string
    }).ignore.array,
    latitude: s.string,
    longitude: s.string,
    population: s.string,
    region: s.object({
      value: s.string
    }).ignore.array,
    weatherUrl: s.object({
      value: s.string
    }).ignore.array
  }).ignore.array,
  request: s.object({
    query: s.string,
    type: s.string
  }).ignore.array,
  weather: s.object({
    astronomy: s.object({
      moon_illumination: s.string,
      moon_phase: s.string,
      moonrise: s.string,
      moonset: s.string,
      sunrise: s.string,
      sunset: s.string
    }).ignore.array,
    avgtempC: s.string,
    avgtempF: s.string,
    date: s.string,
    hourly: s.object({
      DewPointC: s.string,
      DewPointF: s.string,
      FeelsLikeC: s.string,
      FeelsLikeF: s.string,
      HeatIndexC: s.string,
      HeatIndexF: s.string,
      WindChillC: s.string,
      WindChillF: s.string,
      WindGustKmph: s.string,
      WindGustMiles: s.string,
      chanceoffog: s.string,
      chanceoffrost: s.string,
      chanceofhightemp: s.string,
      chanceofovercast: s.string,
      chanceofrain: s.string,
      chanceofremdry: s.string,
      chanceofsnow: s.string,
      chanceofsunshine: s.string,
      chanceofthunder: s.string,
      chanceofwindy: s.string,
      cloudcover: s.string,
      humidity: s.string,
      precipInches: s.string,
      precipMM: s.string,
      pressure: s.string,
      pressureInches: s.string,
      tempC: s.string,
      tempF: s.string,
      time: s.string,
      uvIndex: s.string,
      visibility: s.string,
      visibilityMiles: s.string,
      weatherCode: s.string,
      weatherDesc: s.object({
        value: s.string
      }).ignore.array,
      weatherIconUrl: s.object({
        value: s.string
      }).ignore.array,
      winddir16Point: s.string,
      winddirDegree: s.string,
      windspeedKmph: s.string,
      windspeedMiles: s.string
    }).ignore.array,
    maxtempC: s.string,
    maxtempF: s.string,
    mintempC: s.string,
    mintempF: s.string,
    sunHour: s.string,
    totalSnow_cm: s.string,
    uvIndex: s.string
  }).ignore.array
})
