import { ApplicationCommandOption, Interaction } from 'discord.js';

interface InteractionOptions {
    defer: boolean
}

export abstract class Interactions {
    data: ApplicationCommandOption;
    options?: InteractionOptions;
    constructor(data: ApplicationCommandOption, options?: InteractionOptions) {
        this.data = data;
        this.options = options;
    }
    
    abstract init(arg: Interaction): Promise<unknown> | unknown;
}