type KeyString = Record<string, string>;

interface Package {
    _id: string,
    _rev: string,
    name: string,
    description: string,
    'dist-tags': {
        latest: string
        [key: string]: string | undefined
    },
    versions: {
        [key: string]: {
            name: string
            version: string
            description: string
            main?: string
            scripts: KeyString
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
            devDependencies: KeyString
            dependencies: KeyString
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

    },
    readme: string,
    maintainers: {
        name: string
        email: string
    }[],
    time?: KeyString,
    homepage?: string,
    keywords: string[],
    repository: {
        type: string
        url: string
    }
    author?: {
        name: string
    },
    bugs: {
        url: string
    },
    license: string,
    readmeFilename: string,
    users: Record<string, boolean>
}

interface NPMError {
    code: string;
    message: string;
}

export type INPMPackage = NPMError | Package | { error: string };

declare const npm: (package_name: string) => Promise<INPMPackage>