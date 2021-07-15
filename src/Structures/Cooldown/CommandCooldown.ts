import { Snowflake } from 'discord.js';
import { KhafraClient } from '../../Bot/KhafraBot.js';

export const CommandCooldown = new Map<string, Set<Snowflake>>();
export const notified = new Set<Snowflake>();

/**
 * Check if a command is ratelimited for a user, set limit otherwise, and remove limit when applicable
 * @return {boolean} false if the user is limited, true otherwise
 */
export const commandLimit = (name: string, user: Snowflake): boolean => {
    const commandCooldown = CommandCooldown.get(name);
    if (commandCooldown.has(user))
        return false;

    const command = KhafraClient.Commands.get(name);
    commandCooldown.add(user);

    // somewhat interesting, we use the callback version rather than a promisifed function
    // so this isn't blocking the return statement.
    setTimeout(() => {
        commandCooldown.delete(user);
        notified.delete(user);
    }, command.settings.ratelimit * 1000).unref();
    return true;
}