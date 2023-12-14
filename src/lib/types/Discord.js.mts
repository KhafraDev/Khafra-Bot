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

/* eslint-disable @typescript-eslint/no-unnecessary-type-constraint */
export const isText = <T extends unknown>(c: T): c is T & (TextChannel | NewsChannel) =>
  c instanceof TextChannel || c instanceof NewsChannel
export const isTextBased = <T extends unknown>(c: T): c is
  & T
  & (
    TextChannel | DMChannel | NewsChannel | ThreadChannel | VoiceChannel
  ) => isText(c) || isDM(c) || isThread(c) || isVoice(c)
export const isGuildTextBased = <T extends unknown>(c: T): c is
  & T
  & (
    TextChannel | NewsChannel | ThreadChannel | VoiceChannel
  ) => isText(c) || isThread(c) || isVoice(c)
export const isDM = <T extends unknown>(c: T): c is T & DMChannel | T & PartialDMChannel => c instanceof DMChannel
export const isExplicitText = <T extends unknown>(c: T): c is T & TextChannel => c instanceof TextChannel
export const isVoice = <T extends unknown>(c: T): c is T & VoiceChannel => c instanceof VoiceChannel
export const isCategory = <T extends unknown>(c: T): c is T & CategoryChannel => c instanceof CategoryChannel
export const isStage = <T extends unknown>(c: T): c is T & StageChannel => c instanceof StageChannel
export const isThread = <T extends unknown>(c: T): c is T & ThreadChannel => c instanceof ThreadChannel
/* eslint-enable @typescript-eslint/no-unnecessary-type-constraint */
