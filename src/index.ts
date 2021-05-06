import './lib/Utility/load.env.ts';

import { startBot, Intents } from 'https://deno.land/x/discordeno/mod.ts';

startBot({
    token: Deno.env.get('TOKEN')!,
    intents: [
        Intents.DIRECT_MESSAGES,
        Intents.GUILDS,
        Intents.GUILD_BANS,
        Intents.GUILD_EMOJIS,
        Intents.GUILD_MEMBERS,
        Intents.GUILD_MESSAGES,
        Intents.GUILD_MESSAGE_REACTIONS,
        Intents.GUILD_PRESENCES
    ],
    eventHandlers: {
        ready() {
            console.log("Successfully connected to gateway");
        },
        messageCreate(message) {
            if (message.content === "ping") {
                message.reply("Pong using Discordeno!");
            }
        },
    },
});