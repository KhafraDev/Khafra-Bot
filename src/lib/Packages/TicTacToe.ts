import { chunkSafe } from '../Utility/Array.js';

type Turn = 'X' | 'O' | ' ';

export class TicTacToe {
    public board: Turn[] = Array(9).fill(' ');
    public turn: Turn = 'X';
    // empty line
    private static empty = '   |   |   \n';
    // row delimiter
    private static newLine = '-----------\n';

    /** Go at a given position (0-8) */
    public go(at: number) {
        if (this.winner())
            return this.winner();
        else if (!(at in this.board))
            throw new TypeError('Expected num 0-8');
        else if (this.board[at] !== ' ') // already taken
            return null;

        this.board[at] = this.turn;

        if (this.winner())
            return this.turn;

        this.setTurn();
        return true;
    }

    /** Use totally legit AI (copyright 2021, @KhafraDev) to go */
    public botGo() {
        const lines = [
            // horizontal
            [0, 1, 2], [1, 2, 0], [0, 2, 1], 
            [3, 4, 5], [4, 5, 3], [3, 5, 4],
            [6, 7, 8], [7, 8, 6], [6, 8, 7],
            // vertical
            [0, 3, 6], [3, 6, 0], [0, 6, 3],
            [0, 3, 6], [4, 7, 1], [1, 7, 4],
            [2, 5, 8], [5, 8, 2], [2, 8, 5],
            // diagonal
            [0, 4, 8], [4, 8, 0], [0, 8, 4],
            [2, 4, 6], [4, 6, 2], [2, 6, 4],
        ];

        for (const [a, b, c] of lines) {
            if (
                // if there are any spots where a person could win in the next move, go there
                ((this.board[a] === 'X' && this.board[b] === 'X') || 
                (this.board[a] === 'O' && this.board[b] === 'O')) &&
                this.board[c] === ' ' // otherwise, just go somewhere empty
            )  {
                return this.go(c);
            }
        }
        
        while (!this.isFull()) {
            const random = Math.floor(Math.random() * 9); // [0, 8]
            if (this.board[random] === ' ') { // is an empty space
                return this.go(random); // go at empty space
            }
        }
    }

    /** Utility method to change turns */
    public setTurn() {
        return this.turn = this.turn === 'X' ? 'O' : 'X';
    }

    /** Detect if the board is full */
    public isFull() {
        return this.board.every(b => b !== ' ');
    }

    public winner() {
        // winning options
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6]
        ];

        for (const [a, b, c] of lines) {
            if (
                this.board[a] !== ' ' && // make sure it's not an empty box
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]
            ) {
                return true;
            }
        }

        return false;
    }

    /** Stringifies the board into a Discord usable string */
    public [Symbol.toPrimitive]() {
        return chunkSafe(this.board, 3) // chunk board into rows of 3
            .map(p => // since its split into chunks of 3, 1 is the middle of the row
                p.map((piece, idx) => idx === 1 ? `| ${piece} |` : ` ${piece} `))
            .map((row, idx) => 
                `${TicTacToe.empty}${row.join('')}\n${TicTacToe.empty}${idx === 2 ? '' : TicTacToe.newLine}`)
            .join('')
            .trimEnd();
    }
}