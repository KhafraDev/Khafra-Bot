export interface GuardianResponse {
    response: {
        status: 'ok',
        userTier: 'developer',
        total: number,
        startIndex: number,
        pageSize: number,
        currentPage: number,
        pages: number,
        orderBy: string,
        results: {
            id: string,
            type: string,
            sectionId: string,
            sectionName: string,
            webPublicationDate: Date,
            webTitle: string,
            webUrl: string,
            apiUrl: string,
            isHosted: boolean,
            pillarId: string,
            pillarName: string
        }[]
    }
}