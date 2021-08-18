export interface NounSearch {
    counts: {
        collections: number
        icons: number
        photos: number
    }
    generated_at: Date
    icons: {
        attribution: string
        attribution_preview_url: string
        collections: {
            author: { 
                location: string
                name: string
                permalink: string
                username: string 
            }
            author_id: string
            date_created: Date
            date_updated: Date
            description: string
            id: string
            is_collaborative: string
            is_featured: string
            is_published: string
            is_store_item: string
            name: string
            permalink: string
            slug: string
            sponsor: unknown
            sponsor_campaign_link: string
            sponsor_id: string
            tags: { id: number, slug: string }[]
            template: string
        }
        date_uploaded: Date
        id: string
        is_active: string
        is_explicit: string
        license_description: string
        nounji_free: string
        permalink: string
        preview_url: string
        preview_url_42: string
        preview_url_84: string
        sponsor: unknown
        sponsor_campaign_link: string | null
        sponsor_id: string
        tags: { id: number, slug: string }[]
        term: string
        term_id: number
        term_slug: string
        updated_at: Date
        uploader: { 
            location: string, 
            name: string, 
            permalink: string
        }
        uploader_id: string
        year: number
    }[]
    query_info: {
        query: string
        result_type: 'icons'
        scope_id: unknown | null
        scope_type: unknown | null
    }
}