import fetch from 'node-fetch';
import { stringify } from 'querystring';
import { URL } from 'url';

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

const base = {
    search: 'https://api.themoviedb.org/3/search/movie',
    detail: 'https://api.themoviedb.org/3/movie/'
} as const;
const headers = {
    'Authorization': `Bearer ${process.env.TMDB}`,
    'Content-Type': 'application/json;charset=utf-8'
};

export const searchMovie = async (
    query: string,
    language = 'en-US',
    include_adult = false
) => {
    // if the question mark is appended to the base url, it's stripped by new URL(...)
    const qs = '?' + stringify({ query, language, include_adult, page: 1 });
    const res = await fetch(new URL(qs, base.search).href, { headers });
    const search = await res.json() as ITMDBSearch;

    if (search.total_results === 0 || search.results.length === 0)
        return null;

    const dRes = await fetch(`${base.detail}${search.results[0].id}`, { headers });
    const details = await dRes.json() as ITMDBDetails;

    return { search, details };
}