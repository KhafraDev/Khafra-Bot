import {
  CategoryChannel,
  DMChannel,
  NewsChannel,
  type PartialDMChannel,
  StageChannel,
  TextChannel,
  ThreadChannel,
  VoiceChannel
} from 'discord.js'

export const isText = <T,>(c: T): c is T & (TextChannel | NewsChannel) =>
  c instanceof TextChannel || c instanceof NewsChannel
export const isTextBased = <T,>(
  c: T
): c is T & (TextChannel | DMChannel | NewsChannel | ThreadChannel | VoiceChannel) =>
  isText(c) || isDM(c) || isThread(c) || isVoice(c)
export const isGuildTextBased = <T,>(c: T): c is T & (TextChannel | NewsChannel | ThreadChannel | VoiceChannel) =>
  isText(c) || isThread(c) || isVoice(c)
export const isDM = <T,>(c: T): c is (T & DMChannel) | (T & PartialDMChannel) => c instanceof DMChannel
export const isExplicitText = <T,>(c: T): c is T & TextChannel => c instanceof TextChannel
export const isVoice = <T,>(c: T): c is T & VoiceChannel => c instanceof VoiceChannel
export const isCategory = <T,>(c: T): c is T & CategoryChannel => c instanceof CategoryChannel
export const isStage = <T,>(c: T): c is T & StageChannel => c instanceof StageChannel
export const isThread = <T,>(c: T): c is T & ThreadChannel => c instanceof ThreadChannel
