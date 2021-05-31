import fetch from 'node-fetch';

export interface IOpenLib {
    cover_i: number
    has_fulltext: boolean
    title: string
    title_suggest: string
    lending_identifier_s: string
    ia_collection_s: string
    type: string
    ebook_count_i: number
    printdisabled_s: string
    edition_count: number
    key: string
    public_scan_b: true
    last_modified_i: number
    lending_edition_s: string
    cover_edition_key: string
    first_publish_year: number
    author_name: string[]
    publish_year: number[]
    id_amazon: string[]
    seed: string[]
    subject: string[]
    author_alternative_name: string[]
    isbn: string[]
    ia_loaded_id: string[]
    edition_key: string[]
    language: string[]
    id_librarything: string[]
    id_amazon_de_asin: string[]
    lcc: string[]
    id_goodreads: string[]
    lccn: string[]
    publish_place: string[]
    contributor: string[]
    id_google: string[]
    ia: string[]
    text: string[]
    id_british_library: string[]
    place: string[]
    id_amazon_it_asin: string[]
    ddc: string[]
    author_key: string[]
    id_nla: string[]
    id_british_national_bibliography: string[]
    id_project_gutenberg: string[]
    id_overdrive: string[]
    id_alibris_id: string[]
    id_canadian_national_library_archive: string[]
    ia_box_id: string[]
    first_sentence: string[]
    person: string[]
    id_wikidata: string[]
    oclc: string[]
    id_amazon_co_uk_asin: string[]
    publisher: string[]
    id_amazon_ca_asin: string[]
    time: string[]
    publish_date: string[]
    id_hathi_trust: string[]
    id_paperback_swap: string[]
}

interface IOpenLibRes {
    numFound: number
    start: number
    num_found: number
    docs: IOpenLib[]
}

export const openLibrary = async (q: string) => {
    q = encodeURIComponent(q.replace(/\s+/g, '+'));
    const res = await fetch(`https://openlibrary.org/search.json?q=${q}&has_fulltext=true&limit=1`);
    const json = await res.json() as IOpenLibRes;

    return json;
}