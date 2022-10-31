interface Package {
  _id: string
  _rev: string
  name: string
  description: string
  'dist-tags': {
      latest: string
      [key: string]: string | undefined
  }
  versions: {
    [key: string]: {
      name: string
      version: string
      description: string
      main?: string
      scripts: Record<string, string>
      repository: {
          type: string
          url: string
      }
      keywords: string[]
      author: {
          name: string
      }
      license: string
      bugs: {
          url: string
      }
      homepage: string
      devDependencies: Record<string, string>
      dependencies: Record<string, string>
      gitHead?: string
      _id: string
      _shasum?: string
      _from?: string
      _npmVersion?: string
      _npmUser?: {
          name?: string
          email?: string
      }
      maintainers: {
          name: string
          email: string
      }[]
      dist?: {
          shasum: string
          tarball: string
      }
      directories: unknown
    }
  }
  readme: string
  maintainers: {
      name: string
      email: string
  }[]
  time?: Record<string, string>
  homepage?: string
  keywords: string[]
  repository: {
      type: string
      url: string
  }
  author?: {
      name: string
  }
  bugs: {
      url: string
  }
  license: string
  readmeFilename: string
  users: Record<string, boolean>
}

interface NPMError {
  code: string
  message: string
}

export type INPMPackage = NPMError | Package | { error: string }

export const npm = async (packageName: string): Promise<INPMPackage> => {
  const name = encodeURIComponent(packageName)
  const response = await fetch(`https://registry.npmjs.com/${name}`)

  return await response.json()
}
