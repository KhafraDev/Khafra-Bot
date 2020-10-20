import { chunk } from '../../Utility/Array.js';

class Connect4 {
    /**
     * 2d array of "board" columns
     * @type {string[][]}
     */
    board: string[][] = Array.from(chunk(Array.from(Array(42), () => '🟡'), 6));
    /**
     * player's turn
     * 🔴 ⚪
     * @type {'red'|'white'}
     */
    turn: 'red' | 'white' = 'red';

    row(index: number) {
        return this.board.map(v => v[index]);
    }

    /**
     * Set a piece in the given column
     * @param {number} index 
     * @returns {void | -1} -1 if the row is invalid
     */
    go(index: number): void | -1 {
        // if every spot in said column is taken
        if(!this.board[index].some(v => v === '🟡')) {
            return -1;
        }

        for(let i = 0; i < this.board[index].length; i++) {
            if(this.board[index][i] === '🟡') {
                this.board[index][i] = this.turn === 'red' ? '🔴' : '⚪';
                break;
            }
        }

        this.setTurn();
    }

    setTurn() {
        this.turn = this.turn === 'red' ? 'white' : 'red';
    }

    /**
     * Formats the board into a Discord embeddable string
     */
    format() {
        const brd: string[] = [];
        for(let i = 5; i >= 0; i--) {
            brd.push(this.row(i).join(' | '));
        } 
        return brd.join('\n');
    }
}

export { Connect4 };