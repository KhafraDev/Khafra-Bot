import { cwd } from '#khaf/utility/Constants/Path.js';
import { createFileWatcher } from '#khaf/utility/FileWatcher.js';
import { permResolvableToString } from '#khaf/utility/Permissions.js';
import type { APIEmbed, APIEmbedField } from 'discord-api-types/v10';
import type {
    AnyChannel,
    GuildMember,
    PermissionResolvable,
    Role
} from 'discord.js';
import { join } from 'node:path';

const config = createFileWatcher(
    {} as typeof import('../../../../config.json'),
    join(cwd, 'config.json')
);

const kIsJSONEmbed = Symbol('api embed');

export const colors = {
    ok: Number.parseInt(config.colors.default.slice(1), 16),
    error: Number.parseInt(config.colors.error.slice(1), 16),
    boost: Number.parseInt(config.colors.boost.slice(1), 16)
} as const;

export const Embed = {
    error (reason?: string): APIEmbed {
        const Embed = EmbedUtil.setColor(this.json(), colors.error);

        if (reason) {
            EmbedUtil.setDescription(Embed, reason);
        }

        return Embed;
    },

    /**
     * An embed for a command being successfully executed!
     */
    ok (reason?: string): APIEmbed {
        const Embed = EmbedUtil.setColor(this.json(), colors.ok);

        if (reason) {
            EmbedUtil.setDescription(Embed, reason);
        }

        return Embed;
    },

    perms (
        inChannel: AnyChannel,
        userOrRole: GuildMember | Role | null,
        permissions: PermissionResolvable
    ): APIEmbed {
        const perms = permResolvableToString(permissions);
        const checkType = userOrRole && 'color' in userOrRole
            ? `The role ${userOrRole}`
            : userOrRole
                ? `User ${userOrRole}`
                : 'The user';
        const amountMissing = perms.length === 1 ? 'this permission' : 'these permissions';

        const embed = this.json();
        const reason =
            `${checkType} is missing ${amountMissing}: ${perms.join(', ')} in ${inChannel}`;

        EmbedUtil.setDescription(embed, reason);
        return embed;
    },

    json (data?: Partial<APIEmbed>): APIEmbed {
        const embed: APIEmbed & { [kIsJSONEmbed]: true } = {
            fields: [],
            [kIsJSONEmbed]: true
        };

        if (data !== undefined) {
            Object.assign(embed, data);
        }

        return embed;
    }
}

export const padEmbedFields = (embed: APIEmbed): APIEmbed => {
    const { fields } = embed;

    if (fields === undefined) return embed;

    while (fields.length % 3 !== 0 && fields.length !== 0) {
        EmbedUtil.addField(embed, { name: '\u200b', value: '\u200b', inline: true });
    }

    return embed;
}

export const EmbedUtil = {
    addField (embed: APIEmbed, field: APIEmbedField): APIEmbed {
        if (embed.fields === undefined) {
            embed.fields = [];
        }

        embed.fields.push(field);
        return embed;
    },
    addFields (embed: APIEmbed, ...fields: APIEmbedField[]): APIEmbed {
        if (embed.fields === undefined) {
            embed.fields = [];
        }

        embed.fields.push(...fields);
        return embed;
    },
    setAuthor (embed: APIEmbed, author: APIEmbed['author']): APIEmbed {
        embed.author = author;
        return embed;
    },
    setColor (embed: APIEmbed, color: APIEmbed['color']): APIEmbed {
        embed.color = color;
        return embed;
    },
    setDescription (embed: APIEmbed, description: APIEmbed['description']): APIEmbed {
        embed.description = description;
        return embed;
    },
    setFooter (embed: APIEmbed, footer: APIEmbed['footer']): APIEmbed {
        embed.footer = footer;
        return embed;
    },
    setImage (embed: APIEmbed, image: APIEmbed['image']): APIEmbed {
        embed.image = image;
        return embed;
    },
    setThumbnail (embed: APIEmbed, thumbnail: APIEmbed['thumbnail']): APIEmbed {
        embed.thumbnail = thumbnail;
        return embed;
    },
    setTimestamp (embed: APIEmbed, timestamp: APIEmbed['timestamp']): APIEmbed {
        embed.timestamp = timestamp;
        return embed;
    },
    setTitle (embed: APIEmbed, title: APIEmbed['title']): APIEmbed {
        embed.title = title;
        return embed;
    },
    setURL (embed: APIEmbed, url: APIEmbed['url']): APIEmbed {
        embed.url = url;
        return embed;
    },
    isAPIEmbed (embed: unknown): embed is APIEmbed {
        return (
            embed != null &&
            (embed as { [kIsJSONEmbed]?: boolean })[kIsJSONEmbed] === true
        );
    }
}