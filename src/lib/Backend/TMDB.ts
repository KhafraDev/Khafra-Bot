import fetch, { Headers } from 'node-fetch';
import { URL, URLSearchParams } from 'url';

interface ITMDBSearch {
    page: number
    results: {
        poster_path: string | null
        adult: boolean
        overview: string
        release_date: string
        genre_ids: number[]
        id: number
        original_title: string
        original_language: string
        title: string
        backdrop_path: string | null
        popularity: number
        vote_count: number
        video: boolean
        vote_average: number
    }[]
    total_results: number
    total_pages: number
}

interface ITMDBDetails {
    adult: boolean
    backdrop_path: string | null
    belongs_to_collection: unknown | null
    budget: number
    genres: { id: number, name: string }[]
    homepage: string | null
    id: number
    imdb_id: string | null
    original_language: string
    original_title: string
    overview: string | null
    popularity: number
    poster_path: string | null
    production_companies: {
        name: string
        id: number
        logo_path: string | null
        origin_country: string
    }[]
    production_countries: { iso_3166_1: string, name: string }[]
    release_date: string
    revenue: number
    runtime: number | null
    spoken_languages: { iso_639_1: string, name: string }[]
    status: 'Rumored' | 'Planned' | 'In Production' | 'Post Production' | 'Released' | 'Canceled'
    tagline: string | null
    title: string
    video: boolean
    vote_average: number
    vote_count: number
}

interface TV {
    page: number
    results: {
        poster_path: string | null
        popularity: number
        id: number
        backdrop_path: string | null
        vote_average: number
        overview: string
        first_air_date: string
        origin_country: string[]
        genre_ids: number[]
        original_language: string
        vote_count: string
        name: string
        original_name: string
    }[]
    total_results: number
    total_pages: number
}

interface TVDetails {
    backdrop_path: string | null
    created_by: {
        id: number
        credit_id: string
        name: string
        gender: number
        profile_path: string | null
    }
    episode_run_time: number[]
    first_air_date: string
    genres: {    
        id: number
        name: string
    }[]
    homepage: string
    id: number
    in_production: boolean
    languages: string[]
    last_air_date: string
    last_episode_to_air: {        
        air_date: string
        episode_number: number
        id: number
        name: string
        overview: string
        production_code: string
        season_number: number
        still_path: string | null
        vote_average: number
        vote_count: number
    }
    name: string
    next_episode_to_air: null
    networks: {
        name: string
        id: number
        logo_path: string | null
        origin_country: string
    }
    number_of_episodes: number
    number_of_seasons: number
    origin_country: string[]
    original_language: string
    original_name: string
    overview: string
    popularity: string
    poster_path: string | null
    production_companies: {
        id: number
        logo_path: string | null
        name: string
        origin_country: string
    }
    production_countries: {
        iso_3166_1: string
        name: string
    }
    seasons: {
        air_date: string
        episode_count: number
        id: number
        name: string
        overview: string
        poster_path: string
        season_number: number
    }
    spoken_languages: {
        english_name: string
        iso_639_1: string
        name: string
    }
    status: string
    tagline: string
    type: string
    vote_average: number
    vote_count: number
}

const base = {
    search: 'https://api.themoviedb.org/3/search/movie',
    tv: 'https://api.themoviedb.org/3/search/tv',
    detail: 'https://api.themoviedb.org/3/movie/',
    detail_tv: 'https://api.themoviedb.org/3/tv/'
} as const;
const headers = new Headers({
    'Authorization': `Bearer ${process.env.TMDB}`,
    'Content-Type': 'application/json;charset=utf-8'
});

export const searchMovie = async (
    query: string,
    include_adult = false
) => {
    const params = new URLSearchParams({ 
        query, 
        include_adult: `${include_adult}`
    }).toString().replace(/\+/g, '%20'); 
    // if the question mark is appended to the base url, it's stripped by new URL(...)
    const res = await fetch(new URL(`?${params}`, base.search), { headers });
    const search = await res.json() as ITMDBSearch;

    if (search.total_results === 0 || search.results.length === 0)
        return null;

    const dRes = await fetch(`${base.detail}${search.results[0].id}`, { headers });
    const details = await dRes.json() as ITMDBDetails;

    return details;
}

export const searchTV = async (
    query: string,
    include_adult = false
) => {
    const params = new URLSearchParams({ 
        query, 
        include_adult: `${include_adult}`
    }).toString().replace(/\+/g, '%20'); 

    const res = await fetch(new URL(`?${params}`, base.tv), { headers });
    const tv = await res.json() as TV;

    if (tv.total_results === 0 || tv.results.length === 0)
        return null;

    const tRes = await fetch(`${base.detail_tv}${tv.results[0].id}`, { headers });
    const details = await tRes.json() as TVDetails;

    return details;
}