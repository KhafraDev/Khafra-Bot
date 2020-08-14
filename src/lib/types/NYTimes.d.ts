interface MediaMetadata {
    format: string
    height: number
    url: string
    width: number
}

export interface ViewedArticle {
    status: 'OK',
    copyright: string,
    num_results: number,
    results: {
        uri: string,
        url: string,
        id: number,
        asset_id: number,
        source: string,
        published_date: string,
        updated: Date,
        section: string,
        subsection: string,
        nytdsection: string,
        adx_keywords: string,
        column?: string,
        byline: string,
        type: string,
        title: string,
        abstract: string,  
        //des_facet: [Array],
        org_facet: [],
        //per_facet: [Array],
        geo_facet: [],
        media: {
            approved_for_syndication: boolean,
            caption: string,
            copyright: string
            'media-metadata': MediaMetadata[]
            subtype: string 
            type: string
        },
        eta_id: number
    }[]
}