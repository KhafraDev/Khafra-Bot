import { chunkSafe } from '../Utility/Array.js';

const emojis = [
    '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', 
    '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣',
    '💣'
] as const;

export const Board = () => {
    const board = chunkSafe(Array<number>(100).fill(0), 10);

    for (let i = 0; i < 10;) {
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 10);
        // a spot could theoretically be surrounded by 8 bombs
        // but we use 10 as a placeholder for bombs
        if (board[x][y] <= 8) {
            board[x][y] = 10; //'💣';
            i++;
            
            // horizontal + vertical
            board[x-1]?.[y] === undefined ? null : board[x-1][y] < 8 ? (board[x-1][y] += 1) : null; // 1 row back
            board[x+1]?.[y] === undefined ? null : board[x+1][y] < 8 ? (board[x+1][y] += 1) : null; // 1 row forward
            board[x][y-1]   === undefined ? null : board[x][y-1] < 8 ? (board[x][y-1] += 1) : null; // 1 space back
            board[x][y+1]   === undefined ? null : board[x][y+1] < 8 ? (board[x][y+1] += 1) : null; // 1 space forward

            // diagonal
            board[x-1]?.[y-1] === undefined ? null : board[x-1][y-1] < 8 ? (board[x-1][y-1] += 1) : null; // back 1 row, back 1 space
            board[x-1]?.[y+1] === undefined ? null : board[x-1][y+1] < 8 ? (board[x-1][y+1] += 1) : null; // back 1 row, forward 1 space
            board[x+1]?.[y-1] === undefined ? null : board[x+1][y-1] < 8 ? (board[x+1][y-1] += 1) : null; // forward 1 row, back 1 space
            board[x+1]?.[y+1] === undefined ? null : board[x+1][y+1] < 8 ? (board[x+1][y+1] += 1) : null; // forward 1 row, forward 1 space
        }
    }

    // choose random spot on board that will not be masked
    // this is the starter hint; denoted by -1
    while(!board.flat().includes(-1)) {
        const x = Math.floor(Math.random() * 10)
        const y = Math.floor(Math.random() * 10);
        if (board[x][y] === 0) {
            board[x][y] = -1;
        }
    }

    const emojified = board.map(row => 
        row.map(spot =>
            spot === -1 ? emojis[0] : `|| ${emojis[spot]} ||`
        ).join('')
    ).join('\n');

    return emojified;
}