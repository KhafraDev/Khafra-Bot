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
    messageTranslations: {
        [key: string]: string
    }
    httpCode: number
    httpReason: string
}