import { chunk } from '../Utility/Array.js';

export class TicTacToe {
    turn: 'X' | 'O' = 'X';
    box: Record<string, 'X' | 'O' | ' ' > = {
        1: ' ',
        2: ' ',
        3: ' ',
        4: ' ',
        5: ' ',
        6: ' ',
        7: ' ',
        8: ' ',
        9: ' '
    };
    
    /**
     * Sets the player's turn
     */
    setTurn() {
        this.turn = this.turn === 'X' ? 'O' : 'X';
    }

    checkWinner() {
        const lines = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
            [1, 4, 7],
            [2, 5, 8],
            [3, 6, 9],
            [1, 5, 9],
            [3, 5, 7]
        ];

        for(const [a, b, c] of lines) {
            if( this.box[a] !== ' '
                && this.box[a] === this.box[b] && this.box[a] === this.box[c]
            ) {
                return this.box;
            }
        }
        
        return null;
    }

    botGo() {
        const lines = [
            // horizontal
            [1, 2, 3], [2, 3, 1], [1, 3, 2], 
            [4, 5, 6], [5, 6, 4], [4, 6, 5],
            [7, 8, 9], [8, 9, 7], [7, 9, 8],
            // vertical
            [1, 4, 7], [4, 7, 1], [1, 7, 4],
            [2, 5, 8], [5, 8, 2], [2, 8, 5],
            [3, 6, 9], [6, 9, 3], [3, 9, 6],
            // diagonal
            [1, 5, 9], [5, 9, 1], [1, 9, 5],
            [3, 5, 7], [5, 7, 3], [3, 7, 5],
        ];

        for(const [a, b, c] of lines) {
            if(
                ((this.box[a] === 'X' && this.box[b] === 'X') ||
                (this.box[a] === 'O' && this.box[b] === 'O')) &&
                this.box[c] === ' '
            )  {
                return this.go(c);
            }
        }
        
        while(true) {
            const random = Math.random() * (9 - 1 + 1) + 1 << 0;
            if(this.box[random] === ' ') {
                this.box[random] = 'O';
                if(this.checkWinner()) {
                    return { winner: this.turn };
                }

                return this.setTurn();
            }
        }
    }

    /**
     * Go at a certain box, 1-9, or leave empty for bot to go
     * @param at box to go at (1-9).
     */
    go(at?: number): { error: string } | { winner: string } | void {
        if(at) {
            if(at < 1 || at > 9) {
                return { error: 'Invalid position!' };
            } else if(this.box[at] !== ' ') {
                return { error: 'Box taken!' };
            }

            this.box[at] = this.turn;
            if(this.checkWinner()) {
                return { winner: this.turn };
            }
            return this.setTurn();
        } else {
            if(Object.values(this.box).every(b => b !== ' ')) {
                return { error: 'No boxes left!' };
            }

            return this.botGo();
        }
    }

    format() {
        const spots = Array.from(chunk(Object.values(this.box), 3));
        const empty = Array.from(chunk(Array<string>(9).fill(' '), 3))
            .map(e => e.join(''))
            .join('|');
        
        const board = spots.map(row => {
            return `
${empty}
 ${row.map(s => s).join(' | ')} 
${empty}
-----------`
        });
        return board.join('').split('\n').slice(0, -1).join('\n')
    }
}