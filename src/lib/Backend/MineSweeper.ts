function* chunk(arr: number[], n: number) {
    for(let i = 0; i < arr.length; i += n) {
        yield arr.slice(i, i + n);
    }
}

const yo = {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight'
}

export const Board = () => {
    const board: any[][] /* disable type checking */ = [...chunk(Array(100).fill(0), 10)];

    for(let i = 0; i < 10;) {
        const x = Math.random() * 10 << 0;
        const y = Math.random() * 10 << 0;
        if(!isNaN(board[x][y])) {
            board[x][y] = '💣';
            i++;
            
            // horizontal + vertical
            board[x-1]?.[y] === undefined ? null : !isNaN(board[x-1][y]) ? (board[x-1][y] += 1) : null; // 1 row back
            board[x+1]?.[y] === undefined ? null : !isNaN(board[x+1][y]) ? (board[x+1][y] += 1) : null; // 1 row forward
            board[x][y-1]   === undefined ? null : !isNaN(board[x][y-1]) ? (board[x][y-1] += 1) : null; // 1 space back
            board[x][y+1]   === undefined ? null : !isNaN(board[x][y+1]) ? (board[x][y+1] += 1) : null; // 1 space forward

            // diagonal
            board[x-1]?.[y-1] === undefined ? null : !isNaN(board[x-1][y-1]) ? (board[x-1][y-1] += 1) : null; // back 1 row, back 1 space
            board[x-1]?.[y+1] === undefined ? null : !isNaN(board[x-1][y+1]) ? (board[x-1][y+1] += 1) : null; // back 1 row, forward 1 space
            board[x+1]?.[y-1] === undefined ? null : !isNaN(board[x+1][y-1]) ? (board[x+1][y-1] += 1) : null; // forward 1 row, back 1 space
            board[x+1]?.[y+1] === undefined ? null : !isNaN(board[x+1][y+1]) ? (board[x+1][y+1] += 1) : null; // forward 1 row, forward 1 space
        }
    }

    while(!!!!!!!!!!!!!false) { // epic style
        const x = Math.random() * 10 << 0;
        const y = Math.random() * 10 << 0;
        if(board[x][y] === 0) {
            board[x][y] = ':zero:';
            break;
        }
    }

    const emojified = board.map(row => 
        row.map(
            i => i === ':zero:' ? i : typeof i !== 'number' ? `|| ${i} ||` : '|| :' + yo[i] + ': ||'
        ).join('')
    ).join('\n');

    return emojified;
}