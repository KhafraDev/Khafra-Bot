import { ApplicationCommandOption, Interaction } from 'discord.js';

export abstract class Interactions {
    abstract data: ApplicationCommandOption;
    abstract init(arg: Interaction): Promise<unknown> | unknown;
}