import { ActionRow as BuildersActionRow } from '@discordjs/builders';
import { APIActionRowComponent, ComponentType } from 'discord-api-types/v9';
import { ButtonComponent, SelectMenuComponent } from '../index.js';
import { createComponent } from '../Utility/CreateComponents.js';

export type ActionRowComponent = ButtonComponent | SelectMenuComponent

export class ActionRow<T extends ActionRowComponent> implements BuildersActionRow<T> {
    private data = {
        type: ComponentType.ActionRow,
        components: []
    } as APIActionRowComponent;

    public constructor (data?: APIActionRowComponent) {
        if (data) {
            Object.assign(this.data, data);
        }
    }

    public get type () { return this.data.type; }
    public get components (): T[] {
        return this.data.components.map(o => createComponent(o)) as T[];
    }

    /**
     * Adds components to this action row.
     * @param components The components to add to this action row.
     * @returns
     */
    public addComponents (...components: T[]) {
        this.data.components.push(...components.map(o => o.toJSON()));
        return this;
    }

    /**
     * Sets the components in this action row
     * @param components The components to set this row to
     */
    public setComponents (components: T[]) {
        this.data.components = components.map(o => o.toJSON());
        return this;
    }

    public toJSON(): APIActionRowComponent {
        return this.data
    }
}