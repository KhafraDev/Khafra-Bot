import { Channel, TextChannel, NewsChannel } from "discord.js";

export const isText = <T extends Channel>(c: T): c is T & (TextChannel | NewsChannel) => c.type === 'text' || c.type === 'news';