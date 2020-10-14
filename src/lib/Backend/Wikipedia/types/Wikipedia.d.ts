export interface WikipediaSearch {
    pages: {
        id: number
        key: string
        title: string
        excerpt: string
        description: string
        thumbnail: {
            mimetype: string,
            size?: number,
            width: number,
            height: number
            duration?: number
            url: string
        }
    }[]
}

export interface WikipediaError {
    error: string,
    name: string
    value: string
    failureCode: string
    failureData?: {
        min: number
        curmax: number
        max: number
        highmax: number
    }
    messageTranslations: Record<string, string>
    httpCode: number
    httpReason: string
}

export interface WikipediaArticle {
    type: string
    title: string
    displaytitle: string
    namespace: {
        id: number
        text: string
    }
    wikibase_item: string
    titles: {
        canonical: string
        normalized: string
        display: string
    }
    pageid: number
    thumbnail: {
        source: string
        width: number
        height: number
    }
    originalimage: {
        source: string
        width: number
        height: number
    }
    lang: string
    dir: string
    revision: string
    tid: string
    timestamp: Date
    description: string
    description_source: string
    content_urls: {
        desktop: {
            page: string
            revisions: string
            edit: string
            talk: string
        }
        mobile: {	
            page: string
            revisions: string
            edit: string
            talk: string
        }
    }
    extract: string
    extract_html: string
}

export interface WikipediaArticleNotFound {
    type: string
    title: string
    method: 'get'
    detail: string
    uri: string
}