/**
 * https://support.500px.com/hc/en-us/articles/360002435653-API-
 * "The history of 500px has always encouraged creative development 
 * but as of January 24th number 500px will no longer be offering free access to our API. 
 * This decision was made in order to protect our assets and improve our website's performance."
 * 
 * Wonder what API I'm using then?
 */

import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { notDeepStrictEqual } from 'assert';

interface PXRes {
    id: number
    created_at: string
    privacy: boolean
    profile: boolean
    url: string
    user_id: number
    status: number
    width: number
    height: number
    rating: number
    highest_rating: number
    highest_rating_date: string
    image_format: string
    images: {
        format: string
        size: number
        url: string
        https_url: string
    }[]
    image_url: string[]
    name: string
    description: string | null
    category: number
    taken_at: string
    shutter_speed: string
    focal_length: string
    aperture: string
    camera: string
    lens: null
    iso: string
    location: null
    latitude: null
    longitude: null
    nsfw: boolean
    privacy_level: number
    watermark: boolean
    tags: string[]
    has_nsfw_tags: boolean
    liked: null
    voted: null
    comments_count: number
    votes_count: number
    positive_votes_count: number
    times_viewed: number
    user: {
        id: number
        username: string
        fullname: string
        avatar_version: number
        registration_date: string
        avatars: Record<string, { https: string }>
        userpic_url: string
        userpic_https_url: string
        usertype: number
        active: number
        firstname: string
        lastname: string
        about: string
        city: string
        state: string
        country: string
        cover_url: string
        upgrade_status: number
        affection: number
        followers_count: number
        following: false
    }
    editors_choice: boolean
    editors_choice_date: string | null
    editored_by: string | null
    feature: string
    feature_date: string
    fill_switch: Record<string, boolean>
}

export interface FHPX {
    current_page: number
    total_pages: number
    total_items: number
    photos: PXRes[]
}

export const px = async (q: string, nsfw: boolean): Promise<FHPX> => {
    const params = new URLSearchParams({
        'term': encodeURIComponent(q),
        'type': 'photos',
        'image_size[]': '2048',
        'include_states': 'false',
        'include_tags': 'false',
        'formats': 'jpeg',
        'exclude_nude': !nsfw + '',
        'page': '1',
        'rpp': '5' // limit; number of images
    });

    const res = await fetch('https://api.500px.com/v1/photos/search?' + params.toString(), {
        headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://500px.com/search',
            'x-csrf-token': ''
        }
    });
    const json = await res.json() as FHPX;

    notDeepStrictEqual(json.photos.length, 0);

    return json;
}

