export interface YouTubeError {
    error: {
        code: number,
        message: string,
        errors: Object[],
        status: string
    }
}

export interface YouTubeSearchResults {
    kind: 'youtube#searchListResponse',
    etag: string,
    nextPageToken: string,
    regionCode: string,
    pageInfo: { totalResults: number, resultsPerPage: number },
    items: {
        kind: 'youtube#searchResult',
        etag: string,
        id: { kind: 'youtube#video', videoId: string },
        snippet: {
            publishedAt: Date,
            channelId: string,
            title: string,
            description: string,
            thumbnails: {
                [key in 'default' | 'medium' | 'high']: {
                    url: string,
                    width: number,
                    height: number
                }
            },
            channelTitle: string,
            liveBroadcastContent: string,
            publishTime: Date
        }
    }[]
}