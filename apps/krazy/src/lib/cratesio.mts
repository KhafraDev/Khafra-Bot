interface CratesIOError {
  errors: { detail: string }[]
}

interface CratesIOSuccess {
  categories: {
    category: string
    crates_cnt: string
    created_at: string
    description: string
    id: string
    slug: string
  }[]
  crate: {
    badges: unknown[]
    categories: string[]
    created_at: string
    description: string
    documentation: string | null
    downloads: number
    exact_match: boolean
    homepage: string | null
    id: string
    keywords: string[]
    links: Record<string, string | null>
    max_stable_version: string
    max_version: string
    name: string
    newest_version: string
    recent_downloads: number | null
    repository: string
    updated_at: string
    versions: Record<string, number>
  }
  keywords: {
    crates_cnt: number
    created_at: string
    id: string
    keyword: string
  }[]
  versions: {
    audit_actions: {
      action: string
      time: string
      user: {
        avatar: string
        id: number
        login: string
        name: string
        url: string
      }
    }[]
    checksum: string
    crate: string
    crate_size: number
    created_at: string
    dl_path: string
    downloads: number
    features: unknown
    id: number
    license: string
    links: Record<string, string>
    num: string
    published_by: {
      avatar: string
      id: number
      login: string
      name: string
      url: string
    }
    readme_path: string
    updated_at: string
    yanked: boolean
  }[]
}

export const cratesio = async (name: string): Promise<CratesIOError | CratesIOSuccess> => {
  const response = await fetch(`https://crates.io/api/v1/crates/${name}`, {
    headers: {
      'User-Agent': 'KrazyBot (https://github.com/KhafraDev/Khafra-Bot/tree/master/packages/krazy)'
    }
  })
  return await response.json()
}
