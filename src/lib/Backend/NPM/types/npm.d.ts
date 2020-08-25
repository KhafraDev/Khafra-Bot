interface Package {
    _id: string,
    _rev: string,
    name: string,
    description: string,
    'dist-tags': {
        [key: string]: string
    },
    versions: {
        [key: string]: {
            name: string
            version: string
            description: string
            main?: string
            scripts: {
                [key: string]: string
            }
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
            devDependencies: {
                [key: string]: string
            }
            dependencies: {
                [key: string]: string
            }
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
    time: {
        [key: string]: string
    },
    homepage: string,
    keywords: string[],
    repository: {
        type: string
        url: string
    }
    author: {
        name: string
    },
    bugs: {
        url: string
    },
    license: string,
    readmeFilename: string,
    users: {
        [key: string]: boolean
    }
}

interface NPMError {
    code: string;
    message: string;
}

export type INPMPackage = NPMError | Package | { error: string };