import { APIApplicationCommand, RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
import { Interaction, InteractionReplyOptions, PermissionResolvable } from 'discord.js';

interface InteractionOptions {
    defer?: boolean
    ownerOnly?: boolean
    replyOpts?: InteractionReplyOptions
    permissions?: PermissionResolvable
}

type HandlerReturn =
    | string
    | import('discord.js').MessageEmbed
    | import('discord.js').MessageAttachment
    | import('discord.js').InteractionReplyOptions
    | void;

type InteractionData =
    | RESTPostAPIApplicationCommandsJSONBody;

const kId = Symbol('Khafra.Interaction.Id');

export abstract class Interactions {
    private [kId]: APIApplicationCommand['id'];

    constructor(
        public data: InteractionData, 
        public options: InteractionOptions = {}
    ) {
        this.data = data;
        this.options = options;
    }
    
    abstract init(arg: Interaction): Promise<HandlerReturn>;

    public set id (body: APIApplicationCommand['id']) {
        this[kId] = body;
    }

    public get id () {
        return this[kId];
    }
}