import { SelectMenuOption as BuildersSelectMenuOption } from '@discordjs/builders';
import { APIMessageComponentEmoji, APISelectMenuOption } from 'discord-api-types/v9';

/**
 * @see https://discord.com/developers/docs/interactions/message-components#select-menu-object-select-option-structure
 */
export class SelectMenuOption implements BuildersSelectMenuOption {
    private data: APISelectMenuOption = {
        label: '',
        value: ''
    };

    public constructor (data?: APISelectMenuOption) {
        if (data) {
            Object.assign(this.data, data);
        }
    }

    public get label (): string { return this.data.label; }
    public get value (): string { return this.data.value; }
    public get description (): string | undefined { return this.data.description; }
    public get emoji (): APIMessageComponentEmoji | undefined { return this.data.emoji; }
    public get default (): boolean | undefined { return this.data.default; }

    /**
     * Sets the label of this option
     * @param label The label to show on this option
     */
    public setLabel (label: string): this {
        this.data.label = label;
        return this;
    }

    /**
     * Sets the value of this option
     * @param value The value of this option
     */
    public setValue (value: string): this {
        this.data.value = value;
        return this;
    }

    /**
     * Sets the description of this option.
     * @param description The description of this option
     */
    public setDescription (description: string): this {
        this.data.description = description;
        return this;
    }
    
    /**
     * Sets whether this option is selected by default
     * @param isDefault Whether or not this option is selected by default
     */
    public setDefault (isDefault: boolean): this {
        this.data.default = isDefault;
        return this;
    }

    /**
     * Sets the emoji to display on this button
     * @param emoji The emoji to display on this button
     */
    public setEmoji (emoji: APIMessageComponentEmoji): this {
        this.data.emoji = emoji;
        return this;
    }
    
    public toJSON (): APISelectMenuOption {
        return this.data;
    }
}