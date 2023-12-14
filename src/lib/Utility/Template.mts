/**
 * Strip leading indents from a multi-lined template literal.
 */
export const stripIndents = (raw: TemplateStringsArray, ...args: unknown[]): string => {
  const r = String.raw({ raw }, ...args)

  return r.replace(/^[^\S\r\n]+/gm, '').trim()
}
