import { GuildFeatures, Snowflake, Role } from 'discord.js';

type GuildEmoji = {
    name: string,
    roles: Role[],
    id: Snowflake,
    require_colons: boolean,
    managed: boolean,
    animated: boolean,
    available: boolean
}

type Matched = {
    value: string,
    matchLevel: 'full' | 'none',
    fullyHighlighted?: boolean,
    matchedWords: string[]
}

type Localizations = {
    id: number,
    name: {
        default: string,
        localizations: { [key: string]: string }
    },
    is_primary: boolean
}

export interface DiscordDiscoverHits {
    id: Snowflake,
    name: string,
    description: string,
    icon: string,
    splash: string,
    banner: string,
    features: GuildFeatures[],
    approximate_presence_count: number,
    approximate_member_count: number,
    premium_subscription_count: number,
    preferred_locale: string,
    auto_removed: false, // query will only return non-autoremoved values
    discovery_splash: string,
    emojis: GuildEmoji[],
    emoji_count: number,
    primary_category_id: number,
    primary_category: Localizations,
    categories: Localizations[],
    keywords: string[],
    vanity_url_code: string,
    objectID: Snowflake,
    _highlightResult: {
        name: Matched,
        description: Matched,
        primary_category: {
            name: {
                default: Matched 
            }
        },
        categories: {
            name: {
                default: Matched
            }
        }[],
        keywords: Matched[],
        vanity_url_code: Matched
    }
}

export interface DiscordDiscoverResults {
    nbHits: number,
    offset: number,
    length: number,
    exhaustiveNbHits: boolean,
    query: string,
    params: string,
    processingTimeMS: number,
    hits: DiscordDiscoverHits[]
}