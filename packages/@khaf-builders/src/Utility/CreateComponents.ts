/**
 * @license https://github.com/discordjs/discord.js/blob/main/packages/builders/LICENSE
 * Copyright 2021 Noel Buechler
 * Copyright 2021 Vlad Frangu
 */

import { APIMessageComponent, ComponentType } from 'discord-api-types/v9';
import { ActionRow, ButtonComponent, SelectMenuComponent, ActionRowComponent } from '../index.js';

interface MappedComponentTypes {
    [ComponentType.ActionRow]: ActionRow<ActionRowComponent>;
    [ComponentType.Button]: ButtonComponent;
    [ComponentType.SelectMenu]: SelectMenuComponent;
}

/**
 * Factory for creating components from API data
 * @param data The api data to transform to a component class
 */
export function createComponent<T extends keyof MappedComponentTypes>(
    data: APIMessageComponent & { type: T },
): MappedComponentTypes[T];
export function createComponent(data: APIMessageComponent) {
    switch (data.type) {
        case ComponentType.ActionRow:
            return new ActionRow(data);
        case ComponentType.Button:
            return new ButtonComponent(data);
        case ComponentType.SelectMenu:
            return new SelectMenuComponent(data);
    }
}