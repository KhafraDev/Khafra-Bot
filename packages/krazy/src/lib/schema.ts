import { s } from '@sapphire/shapeshift'

export const mdnIndexSchema = s.object({
  doc: s.object({
    isMarkdown: s.boolean,
    isTranslated: s.boolean,
    isActive: s.boolean,
    flaws: s.unknown,
    title: s.string.nullable,
    mdn_url: s.string,
    locale: s.string,
    native: s.string,
    browserCompat: s.string.array,
    sidebarHTML: s.string,
    sidebarMacro: s.string,
    body: s.object({
      type: s.string,
      value: s.object({
        id: s.string.nullable,
        title: s.string.nullable,
        isH3: s.boolean,
        content: s.string.optional
      }).ignore
    }).ignore.array
  })
})
