import { KhafraClient } from '#khaf/Bot';
import { APIApplicationCommand, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { CommandInteraction, InteractionReplyOptions, PermissionResolvable } from 'discord.js';

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
    | import('discord.js').MessageEmbed
    | import('discord.js').MessageAttachment
    | import('discord.js').InteractionReplyOptions
    | null
    | undefined;

type InteractionData =
    | RESTPostAPIApplicationCommandsJSONBody;

const kId = Symbol('Khafra.Interaction.Id');

export class Interactions {
    private [kId]: APIApplicationCommand['id'];

    constructor(
        public data: InteractionData, 
        public options: InteractionOptions = {}
    ) {}
    
    async init (interaction: CommandInteraction): Promise<HandlerReturn> {
        const subcommand = interaction.options.getSubcommand();
        const subcommandName = `${this.data.name}-${subcommand}`;

        if (!KhafraClient.Subcommands.has(subcommandName)) {
            return `❌ This option has not been implemented yet!`;
        }

        const option = KhafraClient.Subcommands.get(subcommandName)!;
        
        return await option.handle(interaction);
    }

    public set id (body: APIApplicationCommand['id']) {
        this[kId] = body;
    }

    public get id () {
        return this[kId];
    }
}

export abstract class InteractionSubCommand {
    public constructor (public data: SubcommandOptions) {}

    public get references () {
        return KhafraClient.Interactions.get(this.data.references)!;
    }

    abstract handle (arg: CommandInteraction): Promise<HandlerReturn>;
}