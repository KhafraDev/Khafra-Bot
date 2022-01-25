import { SelectMenuComponent as BuildersSelectMenu } from '@discordjs/builders';
import { APISelectMenuComponent, ComponentType } from 'discord-api-types/v9';
import { SelectMenuOption } from './SelectMenuOption.js';

/**
 * @see https://discord.com/developers/docs/interactions/message-components#select-menus
 */
export class SelectMenuComponent implements BuildersSelectMenu {
    private data = {
        type: ComponentType.SelectMenu,
        options: [],
        custom_id: ''
    } as APISelectMenuComponent;

    public constructor (data?: APISelectMenuComponent) {
        if (data) {
            Object.assign(this.data, data);
        }
    }

    public get type () { return this.data.type; }
    public get options () { return this.data.options.map(o => new SelectMenuOption(o)); }
    public get placeholder () { return this.data.placeholder; }
    public get min_values () { return this.data.min_values; }
    public get max_values () { return this.data.max_values; }
    public get custom_id () { return this.data.custom_id; }
    public get disabled () { return this.data.disabled; }

    /**
     * Sets the placeholder for this select menu
     * @param placeholder The placeholder to use for this select menu
     */
    public setPlaceholder (placeholder: string) {
        this.data.placeholder = placeholder;
        return this;
    }

    /**
     * Sets thes minimum values that must be selected in the select menu
     * @param minValues The minimum values that must be selected
     */
    public setMinValues (minValues: number) {
        this.data.min_values = minValues;
        return this;
    }

    /**
     * Sets thes maximum values that must be selected in the select menu
     * @param minValues The maximum values that must be selected
     */
    public setMaxValues (maxValues: number) {
        this.data.max_values = maxValues;
        return this;
    }

    /**
     * Sets the custom Id for this select menu
     * @param customId The custom ID to use for this select menu
     */
    public setCustomId (customId: string) {
        this.data.custom_id = customId;
        return this;
    }

    /**
     * Sets whether or not this select menu is disabled
     * @param disabled Whether or not this select menu is disabled
     */
    public setDisabled (disabled: boolean) {
        this.data.disabled = disabled;
        return this;
    }
    
    /**
     * Adds options to this select menu
     * @param options The options to add to this select menu
     * @returns
     */
    public addOptions (...options: SelectMenuOption[]) {
        this.data.options.push(...options.map(o => o.toJSON()));
        return this;
    }
    
    /**
     * Sets the options on this select menu
     * @param options The options to set on this select menu
     */
    public setOptions (options: SelectMenuOption[]) {
        this.data.options = options.map(o => o.toJSON());
        return this;
    }
    
    public toJSON (): APISelectMenuComponent {
        return this.data;
    }
}