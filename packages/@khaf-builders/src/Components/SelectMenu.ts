import { SelectMenuComponent as BuildersSelectMenu } from '@discordjs/builders';
import { APISelectMenuComponent, ComponentType } from 'discord-api-types/v9';
import { SelectMenuOption } from './SelectMenuOption.js';

/**
 * @see https://discord.com/developers/docs/interactions/message-components#select-menus
 */
export class SelectMenuComponent implements BuildersSelectMenu {
    private data: APISelectMenuComponent = {
        type: ComponentType.SelectMenu,
        options: [],
        custom_id: ''
    };

    public constructor (data?: APISelectMenuComponent) {
        if (data) {
            Object.assign(this.data, data);
        }
    }

    public get type (): ComponentType.SelectMenu { return this.data.type; }
    public get options (): SelectMenuOption[] { return this.data.options.map(o => new SelectMenuOption(o)); }
    public get placeholder (): string | undefined { return this.data.placeholder; }
    public get min_values (): number | undefined { return this.data.min_values; }
    public get max_values (): number | undefined { return this.data.max_values; }
    public get custom_id (): string { return this.data.custom_id; }
    public get disabled (): boolean | undefined { return this.data.disabled; }

    /**
     * Sets the placeholder for this select menu
     * @param placeholder The placeholder to use for this select menu
     */
    public setPlaceholder (placeholder: string): this {
        this.data.placeholder = placeholder;
        return this;
    }

    /**
     * Sets thes minimum values that must be selected in the select menu
     * @param minValues The minimum values that must be selected
     */
    public setMinValues (minValues: number): this {
        this.data.min_values = minValues;
        return this;
    }

    /**
     * Sets thes maximum values that must be selected in the select menu
     * @param minValues The maximum values that must be selected
     */
    public setMaxValues (maxValues: number): this {
        this.data.max_values = maxValues;
        return this;
    }

    /**
     * Sets the custom Id for this select menu
     * @param customId The custom ID to use for this select menu
     */
    public setCustomId (customId: string): this {
        this.data.custom_id = customId;
        return this;
    }

    /**
     * Sets whether or not this select menu is disabled
     * @param disabled Whether or not this select menu is disabled
     */
    public setDisabled (disabled: boolean): this {
        this.data.disabled = disabled;
        return this;
    }
    
    /**
     * Adds options to this select menu
     * @param options The options to add to this select menu
     * @returns
     */
    public addOptions (...options: SelectMenuOption[]): this {
        this.data.options.push(...options.map(o => o.toJSON()));
        return this;
    }
    
    /**
     * Sets the options on this select menu
     * @param options The options to set on this select menu
     */
    public setOptions (options: SelectMenuOption[]): this {
        this.data.options = options.map(o => o.toJSON());
        return this;
    }
    
    public toJSON (): APISelectMenuComponent {
        return this.data;
    }
}