import {
  type APIActionRowComponent,
  type APIActionRowComponentTypes,
  type APIButtonComponent,
  type APIChannelSelectComponent,
  type APIMentionableSelectComponent,
  type APIMessage,
  type APIMessageActionRowComponent,
  type APIRoleSelectComponent,
  type APIStringSelectComponent,
  type APITextInputComponent,
  type APIUserSelectComponent,
  ButtonStyle,
  ComponentType
} from 'discord-api-types/v10'
import type { Message } from 'discord.js'

interface SelectMenuReturnType {
  [ComponentType.RoleSelect]: APIRoleSelectComponent
  [ComponentType.UserSelect]: APIUserSelectComponent
  [ComponentType.StringSelect]: APIStringSelectComponent
  [ComponentType.ChannelSelect]: APIChannelSelectComponent
  [ComponentType.MentionableSelect]: APIMentionableSelectComponent
}

export const Components = {
  actionRow<T extends APIActionRowComponentTypes = APIMessageActionRowComponent>(
    components: T[] = []
  ): APIActionRowComponent<T> {
    return {
      type: ComponentType.ActionRow,
      components
    }
  },
  selectMenu<T extends keyof SelectMenuReturnType = ComponentType.StringSelect>(
    options: T extends ComponentType.StringSelect ? Omit<SelectMenuReturnType[T], 'type'> : SelectMenuReturnType[T],
    type: T = ComponentType.StringSelect as T
  ): SelectMenuReturnType[T] {
    return {
      type,
      ...options
    } as SelectMenuReturnType[T]
  },
  textInput(
    options: Required<Pick<APITextInputComponent, 'custom_id' | 'label' | 'style'>> &
      Partial<Omit<APITextInputComponent, 'type'>>
  ): APITextInputComponent {
    return {
      type: ComponentType.TextInput,
      ...options
    }
  }
}

type ButtonOptions = Pick<APIButtonComponent, 'emoji' | 'disabled'>

export const Buttons = {
  approve(label = 'approve', id = 'approve', options: ButtonOptions = {}): APIButtonComponent {
    return {
      type: ComponentType.Button,
      style: ButtonStyle.Success,
      custom_id: id,
      label,
      ...options
    }
  },
  deny(label = 'deny', id = 'deny', options: ButtonOptions = {}): APIButtonComponent {
    return {
      type: ComponentType.Button,
      style: ButtonStyle.Danger,
      custom_id: id,
      label,
      ...options
    }
  },
  secondary(label = 'next', id = 'secondary', options: ButtonOptions = {}): APIButtonComponent {
    return {
      type: ComponentType.Button,
      style: ButtonStyle.Secondary,
      custom_id: id,
      label,
      ...options
    }
  },
  primary(label = 'primary', id = 'primary', options: ButtonOptions = {}): APIButtonComponent {
    return {
      type: ComponentType.Button,
      style: ButtonStyle.Primary,
      custom_id: id,
      label,
      ...options
    }
  },
  link(label: string, url: string, options: ButtonOptions = {}): APIButtonComponent {
    return {
      type: ComponentType.Button,
      style: ButtonStyle.Link,
      url,
      label,
      ...options
    }
  }
}

type ToggleableComponent = Message | APIMessage | { components: APIActionRowComponent<APIButtonComponent>[] }

const toggleComponents = (
  item: ToggleableComponent,
  disabled: boolean
): APIActionRowComponent<APIMessageActionRowComponent>[] => {
  if (!item.components) return []

  const rows: APIActionRowComponent<APIMessageActionRowComponent>[] = []

  for (const { components } of item.components) {
    const newRow = Components.actionRow()
    for (const button of components) {
      const rawButton = 'toJSON' in button ? button.toJSON() : button
      rawButton.disabled = disabled

      newRow.components.push(rawButton)
    }

    rows.push(newRow)
  }

  return rows
}

export const disableAll = (item: ToggleableComponent): APIActionRowComponent<APIMessageActionRowComponent>[] =>
  toggleComponents(item, true)
export const enableAll = (item: ToggleableComponent): APIActionRowComponent<APIMessageActionRowComponent>[] =>
  toggleComponents(item, false)
