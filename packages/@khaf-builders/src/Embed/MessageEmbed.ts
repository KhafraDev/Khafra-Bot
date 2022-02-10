import { AuthorOptions, Embed as BuildersEmbed, FooterOptions } from '@discordjs/builders';
import { APIEmbed, APIEmbedAuthor, APIEmbedField, APIEmbedFooter, APIEmbedImage, APIEmbedProvider, APIEmbedThumbnail, APIEmbedVideo } from 'discord-api-types/v9';

export class Embed implements BuildersEmbed {
    private data: APIEmbed = {
        fields: []
    };

    public get fields (): APIEmbedField[] { return this.data.fields!; }
    public set fields (value) { this.data.fields = value; }

    public get title (): string | undefined { return this.data.title; }
    public set title (value) { this.data.title = value; }

    public get description (): string | undefined { return this.data.description; }
    public set description (value) { this.data.description = value; }

    public get url (): string | undefined { return this.data.url; }
    public set url (value) { this.data.url = value; }

    public get color (): number | undefined { return this.data.color; }
    public set color (value) { this.data.color = value; }

    public get timestamp (): string | undefined { return this.data.timestamp; }
    public set timestamp (value) { this.data.timestamp = value; }

    public get thumbnail (): APIEmbedThumbnail | undefined { return this.data.thumbnail; }
    public set thumbnail (value) { this.data.thumbnail = value; }

    public get image (): APIEmbedImage | undefined { return this.data.image; }
    public set image (value) { this.data.image = value; }

    public get video (): APIEmbedVideo | undefined { return this.data.video; }
    public set video (value) { this.data.video = value; }

    public get author (): APIEmbedAuthor | undefined { return this.data.author; }
    public set author (value) { this.data.author = value; }

    public get provider (): APIEmbedProvider | undefined { return this.data.provider; }
    public set provider (value) { this.data.provider = value; }

    public get footer (): APIEmbedFooter | undefined { return this.data.footer; }
    public set footer (value) { this.data.footer = value; }

    public constructor (data?: APIEmbed) {
        if (data) {
            Object.assign(this.data, data);
        }
    }

    /**
     * The accumulated length for the embed title, description, fields, footer text, and author name
     */
    public get length (): number {
        return (
            (this.title?.length ?? 0) +
            (this.description?.length ?? 0) +
            (this.fields.length >= 1
                ? this.fields.reduce((prev, curr) => prev + curr.name.length + curr.value.length, 0)
                : 0) +
            (this.footer?.text.length ?? 0) +
            (this.author?.name.length ?? 0)
        );
    }

    /**
     * Adds a field to the embed (max 25)
     *
     * @param field The field to add.
     */
    public addField (field: APIEmbedField): this {
        this.data.fields!.push(field);
        return this;
    }

    /**
     * Adds fields to the embed (max 25)
     *
     * @param fields The fields to add
     */
    public addFields (...fields: APIEmbedField[]): this {
        this.data.fields!.push(...fields);
        return this;
    }

    /**
     * Removes, replaces, or inserts fields in the embed (max 25)
     *
     * @param index The index to start at
     * @param deleteCount The number of fields to remove
     * @param fields The replacing field objects
     */
    public spliceFields (index: number, deleteCount: number, ...fields: APIEmbedField[]): this {
        this.data.fields!.splice(index, deleteCount, ...fields);
        return this;
    }

    /**
     * Sets the author of this embed
     *
     * @param options The options for the author
     */
    public setAuthor (options: AuthorOptions | null): this {
        this.data.author = options === null
            ? undefined
            : { name: options.name, icon_url: options.iconURL, url: options.url };

        return this;
    }

    /**
     * Sets the color of this embed
     *
     * @param color The color of the embed
     */
    public setColor (color: number | null): this {
        this.data.color = color ?? undefined;
        return this;
    }

    /**
     * Sets the description of this embed
     *
     * @param description The description
     */
    public setDescription (description: string | null): this {
        this.data.description = description ?? undefined;
        return this;
    }

    /**
     * Sets the footer of this embed
     *
     * @param options The options for the footer
     */
    public setFooter (options: FooterOptions | null): this {
        this.data.footer = options === null
            ? undefined
            : { text: options.text, icon_url: options.iconURL };

        return this;
    }

    /**
     * Sets the image of this embed
     *
     * @param url The URL of the image
     */
    public setImage (url: string | null): this {
        this.data.image = url === null ? undefined : { url };
        return this;
    }

    /**
     * Sets the thumbnail of this embed
     *
     * @param url The URL of the thumbnail
     */
    public setThumbnail (url: string | null): this {
        this.data.thumbnail = url === null ? undefined : { url };
        return this;
    }

    /**
     * Sets the timestamp of this embed
     *
     * @param timestamp The timestamp or date
     */
    public setTimestamp (timestamp?: number | Date | null): this {
        this.data.timestamp = timestamp == null
            ? undefined
            : new Date(timestamp).toISOString();

        return this;
    }

    /**
     * Sets the title of this embed
     *
     * @param title The title
     */
    public setTitle (title: string | null): this {
        this.data.title = title ?? undefined;
        return this;
    }

    /**
     * Sets the URL of this embed
     *
     * @param url The URL
     */
    public setURL (url: string | null): this {
        this.data.url = url ?? undefined;
        return this;
    }

    /**
     * Transforms the embed to a plain object
     */
    public toJSON (): APIEmbed {
        return this.data;
    }

    /**
     * Normalizes field input and resolves strings
     *
     * @param fields Fields to normalize
     */
    static normalizeFields (...fields: APIEmbedField[]): APIEmbedField[] {
        return fields;
    }
}