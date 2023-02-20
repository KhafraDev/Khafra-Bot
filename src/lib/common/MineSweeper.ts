import { chunkSafe } from '#khaf/utility/util.js'

const emojis = [
  '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣',
  '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣',
  '💣'
] as const

export const Board = (): string => {
  const board = chunkSafe(Array<number>(100).fill(0), 10)

  for (let i = 0; i < 10;) {
    const x = Math.floor(Math.random() * 10)
    const y = Math.floor(Math.random() * 10)
    // a spot could theoretically be surrounded by 8 bombs
    // but we use 10 as a placeholder for bombs
    if (board[x][y] <= 8) {
      board[x][y] = 10 //'💣';
      i++

      // horizontal + vertical
      typeof board[x-1]?.[y] === 'number' && board[x-1][y] < 8 && board[x-1][y]++ // 1 row back
      typeof board[x+1]?.[y] === 'number' && board[x+1][y] < 8 && board[x+1][y]++ // 1 row forward
      typeof board[x][y-1]   === 'number' && board[x][y-1] < 8 && board[x][y-1]++ // 1 space back
      typeof board[x][y+1]   === 'number' && board[x][y+1] < 8 && board[x][y+1]++ // 1 space forward

      // diagonal
      typeof board[x-1]?.[y-1] === 'number' && board[x-1][y-1] < 8 && board[x-1][y-1]++ // back 1 row, back 1 space
      typeof board[x-1]?.[y+1] === 'number' && board[x-1][y+1] < 8 && board[x-1][y+1]++ // back 1 row, forward 1 space
      typeof board[x+1]?.[y-1] === 'number' && board[x+1][y-1] < 8 && board[x+1][y-1]++ // forward 1 row, back 1 space
      typeof board[x+1]?.[y+1] === 'number' && board[x+1][y+1] < 8 && board[x+1][y+1]++ // forward 1 row, forward 1 space
    }
  }

  // choose random spot on board that will not be masked
  // this is the starter hint; denoted by -1
  let hasBomb = false
  while (!hasBomb) {
    const x = Math.floor(Math.random() * 10)
    const y = Math.floor(Math.random() * 10)
    if (board[x][y] === 0) {
      board[x][y] = -1
      hasBomb = true
    }
  }

  const emojified = board.map(row =>
    row.map(spot =>
      spot === -1 ? emojis[0] : `|| ${emojis[spot]} ||`
    ).join('')
  ).join('\n')

  return emojified
}
