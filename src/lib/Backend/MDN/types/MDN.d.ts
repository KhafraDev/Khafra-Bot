export interface MDNSearch {
    query: string,
    locale: string,
    page: number,
    pages: number,
    start: number,
    end: number,
    next: string,
    previous: string | null,
    count: number,
    documents: {
        title: string,
        slug: string,
        locale: string,
        excerpt: string      
    }[],
  }