import { DiscordAPIError, Message, MessageAttachment, MessageEmbed, ReplyMessageOptions } from 'discord.js';
import { join } from 'path';
import { createFileWatcher } from '../FileWatcher.js';
import { isDM } from '../../types/Discord.js.js';
import { cwd } from '../Constants/Path.js';
import { Minimalist } from '../Minimalist.js';
import { KhafraClient } from '../../../Bot/KhafraBot.js';
import { cooldown } from '../../../Structures/Cooldown/GlobalCooldown.js';
import { dontThrow } from '../Don\'tThrow.js';
import { Embed } from '../Constants/Embeds.js';
import { Arguments, Command } from '../../../Structures/Command.js';
import { Stats } from '../Stats.js';
import { PartialGuild } from '../../types/KhafraBot.js';
import { inlineCode } from '@khaf/builders';

const config = createFileWatcher({} as typeof import('../../../../config.json'), join(cwd, 'config.json'));
const cooldownUsers = cooldown(10, 60000);
const processArgs = new Minimalist(process.argv.slice(2).join(' '));
const disabled = typeof processArgs.get('disabled') === 'string'
    ? (processArgs.get('disabled') as string)
        .split(',')
        .map(c => c.toLowerCase())
    : [];
const defaultSettings: PartialGuild = {
    prefix: config.prefix,
    max_warning_points: 20,
    mod_log_channel: null,
    welcome_channel: null,
};

export const DM = async (message: Message): Promise<void> => {
    if (!isDM(message.channel)) return;
    if (!message.content.startsWith(defaultSettings.prefix)) return;

    const [nameWithPrefix, ...args] = message.content.split(/\s+/g);
    const commandName = nameWithPrefix.slice(defaultSettings.prefix.length).toLowerCase();
    // !say hello world -> hello world
    const content = message.content.slice(defaultSettings.prefix.length + commandName.length + 1);
    const cli = new Minimalist(content);

    const command = KhafraClient.Commands.get(commandName);

    if (!nameWithPrefix.startsWith(defaultSettings.prefix)) return;
    if (!command) return;

    if (!cooldownUsers(message.author.id)) { // user is rate limited
        return void dontThrow(message.reply({
            embeds: [
                Embed.fail(`Users are limited to 10 commands a minute.`)
            ]
        }));
    } else if (command.settings.ownerOnly && !Command.isBotOwner(message.author.id)) {
        return void dontThrow(message.reply({ 
            embeds: [
                Embed.fail(`\`${command.settings.name}\` is only available to the bot owner!`)
            ] 
        }));
    } else if (command.settings.guildOnly) {
        return void dontThrow(message.reply({
            embeds: [
                Embed.fail(`This command is only available in guilds!`)
            ]
        }));
    } else if (disabled.includes(command.settings.name) || command.settings.aliases?.some(c => disabled.includes(c))) {
        return void dontThrow(message.reply({
            content: `${inlineCode(commandName)} is temporarily disabled!`
        }));
    } 

    const options: Arguments = { args, commandName, content, prefix: defaultSettings.prefix, cli };
    Stats.session++;

    try {
        const returnValue = await command.init(message, options, defaultSettings);
        if (!returnValue || returnValue instanceof Message) 
            return;

        const param = {
            failIfNotExists: false
        } as ReplyMessageOptions;
        
        if (typeof returnValue === 'string')
            param.content = returnValue;
        else if (returnValue instanceof MessageEmbed)
            param.embeds = [returnValue];
        else if (returnValue instanceof MessageAttachment)
            param.files = [returnValue];
        else if (typeof returnValue === 'object') // MessageOptions
            Object.assign(param, returnValue);
        
        return void await message.reply(param);
    } catch (e) {
        if (processArgs.get('dev') === true) {
            console.log(e);
        }
        
        if (!(e instanceof Error)) { 
            return;
        } else if (e instanceof DiscordAPIError) {
            // if there's an error sending a message, we should probably
            // not send another message. in the future try figuring out
            // the error code and basing this check off of that.
            return;
        }

        const error = e.name in command.errors 
            ? command.errors[e.name as keyof typeof command.errors] 
            : command.errors.default;
            
        return void dontThrow(message.reply({ 
            embeds: [Embed.fail(error)],
            failIfNotExists: false
        }));
    }
}