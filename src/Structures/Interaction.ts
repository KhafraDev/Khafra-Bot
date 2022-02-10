import { KhafraClient } from '#khaf/Bot';
import { APIApplicationCommand, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    InteractionReplyOptions,
    MessageContextMenuCommandInteraction,
    PermissionResolvable,
    UserContextMenuCommandInteraction
} from 'discord.js';

interface InteractionOptions {
    defer?: boolean
    ownerOnly?: boolean
    replyOpts?: InteractionReplyOptions
    permissions?: PermissionResolvable
}

interface SubcommandOptions {
    references: string
    name: string
}

type HandlerReturn =
    | string
    | import('@khaf/builders').Embed
    | import('discord.js').MessageAttachment
    | import('discord.js').InteractionReplyOptions
    | null
    | void;

type InteractionData =
    | RESTPostAPIApplicationCommandsJSONBody;

const kId = Symbol('Khafra.Interaction.Id');

export class Interactions {
    private [kId]: APIApplicationCommand['id'];

    constructor(
        public data: InteractionData, 
        public options: InteractionOptions = {}
    ) {}
    
    async init (interaction: ChatInputCommandInteraction): Promise<HandlerReturn> {
        const subcommand =
            interaction.options.getSubcommandGroup(false) ??
            interaction.options.getSubcommand();
        const subcommandName = `${this.data.name}-${subcommand}`;

        if (!KhafraClient.Interactions.Subcommands.has(subcommandName)) {
            return `❌ This option has not been implemented yet!`;
        }

        const option = KhafraClient.Interactions.Subcommands.get(subcommandName)!;
        
        return await option.handle(interaction);
    }

    public set id (body: APIApplicationCommand['id']) {
        this[kId] = body;
    }

    public get id (): string {
        return this[kId];
    }
}

export abstract class InteractionSubCommand {
    public constructor (public data: SubcommandOptions) {}

    public get references (): Interactions {
        return KhafraClient.Interactions.Commands.get(this.data.references)!;
    }

    abstract handle (arg: ChatInputCommandInteraction): Promise<HandlerReturn>;
}

export abstract class InteractionAutocomplete {
    public constructor (public data: SubcommandOptions) {}

    abstract handle (arg: AutocompleteInteraction): Promise<void>;
}

/**
 * @link {https://discord.com/developers/docs/interactions/application-commands#user-commands}
 */
export abstract class InteractionUserCommand {
    constructor (
        public data: InteractionData,
        public options: InteractionOptions = {}
    ) {}

    abstract init (interaction: UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction): Promise<HandlerReturn>;
}