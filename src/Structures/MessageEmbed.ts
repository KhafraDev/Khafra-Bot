import { APIEmbed } from 'discord-api-types';
import {
    ColorResolvable,
    EmbedAuthorData,
    EmbedFieldData,
    EmbedFooterData,
    MessageEmbed as DJSMessageEmbed,
    MessageEmbedAuthor
} from 'discord.js';
import { isDate } from 'util/types';

// A replica of Discord.js' MessageEmbed that will be safe from the useless
// change to @discordjs/builders' Embed that is extremely slow and does a lot
// of validation that is completely useless to everyone using it.

export class MessageEmbed extends DJSMessageEmbed {
    public constructor (data: APIEmbed = {}) {
        super(data);
    }

    public override addField(name: string, value: string, inline = false): this {
        this.fields.push({ name, value, inline });
        return this;
    }

    public override addFields(...fields: EmbedFieldData[] | EmbedFieldData[][]): this {
        const normalized = fields
            .flat(2)
            .map(({ name, value, inline }) => ({ name, value, inline: inline ?? false }));

        this.fields.push(...normalized);
        return this;
    }

    public override setAuthor(options: EmbedAuthorData | null): this;
    public override setAuthor(name: string, iconURL?: string, url?: string): this;
    public override setAuthor(
        name: EmbedAuthorData | null | string,
        iconURL?: string,
        url?: string
    ): this {
        if (typeof name === 'object') {
            if (name === null) {
                this.author = {} as MessageEmbedAuthor;
            } else {
                this.author = {
                    name: name.name,
                    url: name.url,
                    iconURL: name.iconURL
                };
            }

            return this;
        } else {
            // this option isn't used in the bot but we need to support it
            return super.setAuthor(name, iconURL, url);
        }
    }

    public override setColor(color: ColorResolvable): this {
        if (typeof color === 'string') {
            this.color = Number.parseInt(color.replace('#', ''), 16);
        } else if (typeof color === 'number') {
            this.color = color;
        } else {
            this.color = (color[0] << 16) + (color[1] << 8) + color[2];
        }

        return this;
    }

    public override setDescription(description: string): this {
        this.description = description;
        return this;
    }

    public override setFooter(options: EmbedFooterData | null): this;
    public override setFooter(text: string, iconURL?: string): this;
    public override setFooter(text: EmbedFooterData | null | string, iconURL?: string): this {
        if (typeof text === 'object') {
            if (text === null) {
                this.footer = {} as EmbedFooterData;
            } else {
                this.footer = text;
            }

            return this;
        } else {
            // this option isn't used in the bot but we need to support it
            return super.setFooter(text, iconURL);
        }
    }

    public override setImage(url: string): this {
        this.image = { url };
        return this;
    }

    public override setThumbnail(url: string): this {
        this.thumbnail = { url };
        return this;
    }

    public override setTimestamp(timestamp: number | Date | null = Date.now()): this {
        if (isDate(timestamp)) timestamp = timestamp.getTime();

        this.timestamp = timestamp;
        return this;
    }

    public override setTitle(title: string): this {
        this.title = title;
        return this;
    }

    public override setURL(url: string): this {
        this.url = url;
        return this;
    }
}