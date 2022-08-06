import { cwd } from '#khaf/utility/Constants/Path.js'
import { createFileWatcher } from '#khaf/utility/FileWatcher.js'
import { permResolvableToString } from '#khaf/utility/Permissions.js'
import type { APIEmbed } from 'discord-api-types/v10'
import type {
    Channel,
    GuildMember,
    PermissionResolvable,
    Role
} from 'discord.js'
import { join } from 'node:path'

const config = createFileWatcher(
    {} as typeof import('../../../../config.json'),
    join(cwd, 'config.json')
)

const kIsJSONEmbed = Symbol('api embed')

export const colors = {
    ok: Number.parseInt(config.colors.default.slice(1), 16),
    error: Number.parseInt(config.colors.error.slice(1), 16),
    boost: Number.parseInt(config.colors.boost.slice(1), 16)
} as const

export const Embed = {
    error (reason?: string): APIEmbed {
        const Embed = this.json({ color: colors.error })

        if (reason) {
            Embed.description = reason
        }

        return Embed
    },

    /**
     * An embed for a command being successfully executed!
     */
    ok (reason?: string): APIEmbed {
        const Embed = this.json({ color: colors.ok })

        if (reason) {
            Embed.description = reason
        }

        return Embed
    },

    perms (
        inChannel: Channel,
        userOrRole: GuildMember | Role | null,
        permissions: PermissionResolvable
    ): APIEmbed {
        const perms = permResolvableToString(permissions)
        const checkType = userOrRole && 'color' in userOrRole
            ? `The role ${userOrRole}`
            : userOrRole
                ? `User ${userOrRole}`
                : 'The user'
        const amountMissing = perms.length === 1 ? 'this permission' : 'these permissions'

        return this.json({
            description: `${checkType} is missing ${amountMissing}: ${perms.join(', ')} in ${inChannel}`
        })
    },

    json (data?: Partial<APIEmbed>): APIEmbed {
        const embed: APIEmbed & { [kIsJSONEmbed]: true } = {
            fields: [],
            [kIsJSONEmbed]: true
        }

        if (data !== undefined) {
            Object.assign(embed, data)
        }

        return embed
    }
}

export const padEmbedFields = (embed: APIEmbed): APIEmbed => {
    const { fields } = embed

    if (fields === undefined) return embed

    while (fields.length % 3 !== 0 && fields.length !== 0) {
        fields.push({ name: '\u200b', value: '\u200b', inline: true })
    }

    return embed
}

export const EmbedUtil = {
    isAPIEmbed (embed: unknown): embed is APIEmbed {
        return (
            embed != null &&
            (embed as { [kIsJSONEmbed]?: boolean })[kIsJSONEmbed] === true
        )
    }
}