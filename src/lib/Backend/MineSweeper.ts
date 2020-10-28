import { chunk } from '../Utility/Array.js';

const yo: Record<string, string> = {
    '10': ':zero:',
    '9': 'bomb',
    '0': 'zero',
    '1': 'one',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight'
}

export const Board = () => {
    const board = Array.from(chunk(Array<number>(100).fill(0), 10));

    for(let i = 0; i < 10;) {
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 10);
        if(board[x][y] <= 8) {
            board[x][y] = 9; //'💣';
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
    // this is the starter hint; denoted by -2
    while(!!!!!!!!!!!!!false) { // epic style
        const x = Math.floor(Math.random() * 10)
        const y = Math.floor(Math.random() * 10);
        if(board[x][y] === 0) {
            board[x][y] = 10;
            break;
        }
    }

    const emojified = board.map(row => 
        row.map(spot =>
            spot === 10 ? yo[10] : `|| :${yo[spot]}: ||`
        ).join('')
    ).join('\n');

    return emojified;
}