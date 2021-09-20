import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } from '@discordjs/builders';
import { Interaction, InteractionReplyOptions } from 'discord.js';

interface InteractionOptions {
    defer?: boolean
    ownerOnly?: boolean
    replyOpts?: InteractionReplyOptions
}

type HandlerReturn =
    | string
    | import('discord.js').MessageEmbed
    | import('discord.js').MessageAttachment
    | import('discord.js').InteractionReplyOptions
    | import('@discordjs/builders').SlashCommandSubcommandGroupBuilder
    | void;

export abstract class Interactions {
    constructor(
        public data: SlashCommandBuilder | SlashCommandSubcommandGroupBuilder, 
        public options: InteractionOptions = {}
    ) {
        this.data = data;
        this.options = options;
    }
    
    abstract init(arg: Interaction): HandlerReturn | Promise<HandlerReturn>;
}