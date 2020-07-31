function* chunk(arr: string[], length: number) {
    for(let i = 0; i < arr.length; i += length) {
        yield arr.slice(i, i + length);
    }
}

class TicTacToe {
    board: string[][] = Array.from(chunk(Array(81).fill(' '), 9));
    state = {
        pos: {
            1: ' ',
            2: ' ',
            3: ' ',
            4: ' ',
            5: ' ',
            6: ' ',
            7: ' ',
            8: ' ',
            9: ' '
        },
        turn: 'X'
    }

    go(at: number) {
        if(this.state.pos[at + 1] !== ' ') {
            return 0;
        }

        this.state.pos[at + 1] = this.state.turn;
        this.board[at][4] = this.state.turn;
        
        if(this.checkWinner()) {
            return 2;
        }

        this.setTurn();
        return 1;
    }

    goRandom() {
        if(Object.values(this.state.pos).every(box => box !== ' ')) {
            return 3; // draw
        } else if(this.state.turn === 'X') {
            return 0;
        }
        
        while(true) {
            const random = Math.floor(Math.random() * 8 + 1);
            if(this.state.pos[random] === ' ') {
                this.state.pos[random] = this.state.turn;
                
                if(this.checkWinner()) {
                    return 2;
                }

                this.setTurn();
                return 1;
            }
        }
    }

    setTurn() {
        return this.state.turn = this.state.turn === 'X' ? 'O' : 'X';
    }

    bestTurn() {
        const lines = [
            // horizontal
            [0, 1, 2], [1, 2, 0], [0, 2, 1], 
            [3, 4, 5], [4, 5, 4], [3, 5, 4],
            [6, 7, 8], [7, 8, 6], [6, 8, 7],
            // vertical
            [0, 3, 6], [3, 6, 0], [0, 6, 3],
            [1, 4, 7], [4, 7, 1], [1, 7, 4],
            [2, 5, 8], [5, 8, 2], [2, 8, 5],
            // diagonal
            [0, 4, 8], [4, 8, 0], [0, 8, 4],
            [2, 4, 6], [4, 6, 2], [2, 6, 4],
        ];
        
        const squares = Object.values(this.state.pos); // 1, 2, 3... 9
        for(let i = 0; i < lines.length; i++) { // go through turns where someone could win in the next turn
            const [a, b, c] = lines[i]; // a,b = spots to check, c = go
            if(
                ((squares[a] === 'X' && squares[b] === 'X') ||
                (squares[a] === 'O' && squares[b] === 'O')) &&
                squares[c] === ' '
            )  {
                return this.go(c);
            }
        }
        
        return this.goRandom();
    }

    checkWinner() {
        const lines = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        
        const squares = Object.values(this.state.pos);
        for(let i = 0; i < lines.length; i++) {
            const [a,b,c] = lines[i];
            if( squares[a] !== ' ' && 
                squares[a] === squares[b] && squares[a] === squares[c]
            ) {
                return this.state.turn;
            }
        }
        
        return null;
    }

    formatBoard() {
        const { pos } = this.state;

        return `
     │     │    
  ${pos[1]}  │  ${pos[2]}  │  ${pos[3]}
     │     │
─────────────────
     │     │
  ${pos[4]}  │  ${pos[5]}  │  ${pos[6]}
     │     │
─────────────────
     │     │
  ${pos[7]}  │  ${pos[8]}  │  ${pos[9]}
     │     │
        `;
    }
}

export { TicTacToe };