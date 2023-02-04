// Copyright Node.js contributors. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

const tableChars = {
  middleMiddle: '─',
  rowMiddle: '┼',
  topRight: '┐',
  topLeft: '┌',
  leftMiddle: '├',
  topMiddle: '┬',
  bottomRight: '┘',
  bottomLeft: '└',
  bottomMiddle: '┴',
  rightMiddle: '┤',
  left: '│ ',
  right: ' │',
  middle: ' │ '
} as const

const renderRow = (row: string[], columnWidths: number[]): string => {
  let out = tableChars.left
  for (let i = 0; i < row.length; i++) {
    const cell = row[i]
    const needed = (columnWidths[i] - cell.length) / 2
    // round(needed) + ceil(needed) will always add up to the amount
    // of spaces we need while also left justifying the output.
    out += `${' '.repeat(needed)}${cell}${' '.repeat(Math.ceil(needed))}`
    if (i !== row.length - 1)
      out += tableChars.middle
  }
  out += tableChars.right
  return out
}

/**
 * @example
  const t = table({
      Date: ['a', 'b', 'c'],
      joins: ['1', '2', 'hello']
  });
  // ┌──────┬───────┐
  // │ Date │ joins │
  // ├──────┼───────┤
  // │  a   │   1   │
  // │  b   │   2   │
  // │  c   │ hello │
  // └──────┴───────┘
*/
export const table = (obj: Record<string, string[]>): string => {
  const head = Object.keys(obj)
  const columns = Object.values(obj)

  const rows: string[][] = []
  const columnWidths = head.map(h => h.length)
  const longestColumn = Math.max(...columns.map(h => h.length))

  for (let i = 0; i < head.length; i++) {
    const column = columns[i]
    for (let j = 0; j < longestColumn; j++) {
      const value = (rows[j] ??= [])[i] = Object.hasOwn(column, j) ? column[j] : ''
      const width = columnWidths[i] || 0
      columnWidths[i] = Math.max(width, value.length)
    }
  }

  const divider = columnWidths.map(i => tableChars.middleMiddle.repeat(i + 2))

  let result = `${tableChars.topLeft}${divider.join(tableChars.topMiddle)}` +
                 `${tableChars.topRight}\n${renderRow(head, columnWidths)}\n` +
                 `${tableChars.leftMiddle}${divider.join(tableChars.rowMiddle)}` +
                 `${tableChars.rightMiddle}\n`

  for (const row of rows)
    result += `${renderRow(row, columnWidths)}\n`

  result += `${tableChars.bottomLeft}${divider.join(tableChars.bottomMiddle)}${tableChars.bottomRight}`
  return result
}
