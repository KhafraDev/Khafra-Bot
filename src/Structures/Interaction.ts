import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction, InteractionReplyOptions } from 'discord.js';

interface InteractionOptions {
    defer?: boolean
    ownerOnly?: boolean
    replyOpts?: InteractionReplyOptions
}

export abstract class Interactions {
    constructor(
        public data: SlashCommandBuilder, 
        public options: InteractionOptions = {}
    ) {
        this.data = data;
        this.options = options;
    }
    
    abstract init(arg: Interaction): Promise<unknown> | unknown;
}