import { RESTPostAPIApplicationCommandsJSONBody } from 'discord-api-types/v9';
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

export abstract class Interactions {
    constructor(
        public data: InteractionData, 
        public options: InteractionOptions = {}
    ) {
        this.data = data;
        this.options = options;
    }
    
    abstract init(arg: Interaction): HandlerReturn | Promise<HandlerReturn>;
}