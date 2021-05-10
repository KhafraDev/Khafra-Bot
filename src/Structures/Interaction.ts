import { ApplicationCommandOption, Interaction } from 'discord.js';

interface InteractionOptions {
    defer: boolean
}

export abstract class Interactions {
    abstract data: ApplicationCommandOption;
    options?: InteractionOptions;
    abstract init(arg: Interaction): Promise<unknown> | unknown;
}